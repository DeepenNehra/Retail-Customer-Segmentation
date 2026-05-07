"""
Supabase Storage helper — persistent CSV storage for user datasets.
Solves Render's ephemeral filesystem issue: files uploaded here survive server restarts.
"""
import os
import io
from typing import Optional
import pandas as pd

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
BUCKET_NAME = 'datasets'


def _get_client():
    """Create and return a Supabase client, or None if not configured."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[Supabase] Not configured — skipping cloud storage.")
        return None
    try:
        from supabase import create_client
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[Supabase] Failed to create client: {e}")
        return None


def _storage_path(user_id, dataset_id):
    """Returns the path inside the bucket for a user's dataset CSV."""
    return f"{user_id}/dataset_{dataset_id}.csv"


def upload_csv(user_id, dataset_id, df: pd.DataFrame) -> bool:
    """
    Upload a DataFrame as a CSV file to Supabase Storage.
    Called immediately after the user uploads a file.
    Returns True on success, False on failure.
    """
    client = _get_client()
    if not client:
        return False

    try:
        csv_bytes = df.to_csv(index=False).encode('utf-8')
        path = _storage_path(user_id, dataset_id)

        # Remove existing file first to allow re-upload (upsert behaviour)
        try:
            client.storage.from_(BUCKET_NAME).remove([path])
        except Exception:
            pass  # File didn't exist — that's fine

        client.storage.from_(BUCKET_NAME).upload(
            path=path,
            file=csv_bytes,
            file_options={"content-type": "text/csv"},
        )
        print(f"[Supabase] Uploaded dataset {dataset_id} for user {user_id}")
        return True

    except Exception as e:
        print(f"[Supabase] Upload failed for dataset {dataset_id}: {e}")
        return False


def download_csv(user_id, dataset_id) -> Optional[pd.DataFrame]:
    """
    Download a CSV file from Supabase Storage and return as a DataFrame.
    Called when the local disk file is missing (e.g. after a server restart).
    Returns a DataFrame on success, None on failure.
    """
    client = _get_client()
    if not client:
        return None

    try:
        path = _storage_path(user_id, dataset_id)
        raw_bytes = client.storage.from_(BUCKET_NAME).download(path)
        df = pd.read_csv(io.BytesIO(raw_bytes))
        print(f"[Supabase] Downloaded dataset {dataset_id} for user {user_id}")
        return df

    except Exception as e:
        print(f"[Supabase] Download failed for dataset {dataset_id}: {e}")
        return None


def delete_csv(user_id, dataset_id) -> bool:
    """
    Delete a CSV file from Supabase Storage.
    Called when the user deletes a dataset.
    Returns True on success, False on failure.
    """
    client = _get_client()
    if not client:
        return False

    try:
        path = _storage_path(user_id, dataset_id)
        client.storage.from_(BUCKET_NAME).remove([path])
        print(f"[Supabase] Deleted dataset {dataset_id} for user {user_id}")
        return True

    except Exception as e:
        print(f"[Supabase] Delete failed for dataset {dataset_id}: {e}")
        return False
