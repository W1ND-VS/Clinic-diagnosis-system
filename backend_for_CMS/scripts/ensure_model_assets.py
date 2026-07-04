import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MANAGED_DIRECTORIES = [
    PROJECT_ROOT / "app" / "assits",
    PROJECT_ROOT / "app" / "ml_models" / "models",
]
MANAGED_SUFFIXES = {".pkl", ".npy"}
POINTER_SIGNATURE = b"version https://git-lfs.github.com/spec/v1"


def iter_managed_files():
    for directory in MANAGED_DIRECTORIES:
        for path in sorted(directory.iterdir()):
            if path.is_file() and path.suffix in MANAGED_SUFFIXES:
                yield path


def is_lfs_pointer(path: Path) -> bool:
    try:
        with path.open("rb") as file_obj:
            first_line = file_obj.readline().strip()
    except FileNotFoundError:
        return False
    return first_line == POINTER_SIGNATURE


def needs_download(path: Path) -> bool:
    return not path.exists() or is_lfs_pointer(path)


def download_asset(base_url: str, path: Path) -> None:
    asset_url = f"{base_url.rstrip('/')}/{path.name}"
    print(f"Downloading model asset: {asset_url}")
    try:
        with urlopen(asset_url) as response:
            data = response.read()
    except HTTPError as exc:
        raise RuntimeError(
            f"Failed to download {path.name} from {asset_url}: HTTP {exc.code}"
        ) from exc
    except URLError as exc:
        raise RuntimeError(
            f"Failed to download {path.name} from {asset_url}: {exc.reason}"
        ) from exc

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)

    if is_lfs_pointer(path):
        raise RuntimeError(
            f"Downloaded asset for {path.name} is still a Git LFS pointer. "
            "Upload the real binary file to the GitHub Release asset."
        )


def main():
    model_asset_base_url = os.getenv("MODEL_ASSET_BASE_URL", "").strip()
    required_downloads = [path for path in iter_managed_files() if needs_download(path)]

    if not required_downloads:
        print("Model assets are ready.")
        return

    if not model_asset_base_url:
        joined_paths = ", ".join(str(path.relative_to(PROJECT_ROOT)) for path in required_downloads)
        raise RuntimeError(
            "MODEL_ASSET_BASE_URL is required because these model files are missing "
            f"or still Git LFS pointers: {joined_paths}"
        )

    for path in required_downloads:
        download_asset(model_asset_base_url, path)

    print("Model assets downloaded successfully.")


if __name__ == "__main__":
    main()
