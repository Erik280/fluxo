"""
SeuFluxo WhatsApp — Storage Service (Supabase Storage)
Armazena mídias da biblioteca da empresa (Media Library), mídias de respostas rápidas
e thumbnails de contatos diretamente no bucket público 'media-library' do Supabase Storage,
eliminando a necessidade do MinIO.
"""

import logging
from app.config import get_settings

logger = logging.getLogger("seufluxo.storage")

MEDIA_LIBRARY_BUCKET = "media-library"


class StorageService:
    def __init__(self):
        self.settings = get_settings()
        self._client = None
        self.bucket = MEDIA_LIBRARY_BUCKET
        self.public_base_url = (
            getattr(self.settings, "supabase_public_url", "")
            or "https://srv-api.transformafuturo.com.br"
        ).rstrip("/")

    @property
    def client(self):
        """Lazy init do cliente Supabase."""
        if self._client is None:
            from supabase import create_client
            self._client = create_client(
                self.settings.supabase_url,
                self.settings.supabase_key,
            )
        return self._client

    def _ensure_bucket_exists(self):
        """Garante que o bucket media-library existe e é público."""
        try:
            buckets = self.client.storage.list_buckets()
            existing = [b.name for b in buckets]
            if self.bucket not in existing:
                self.client.storage.create_bucket(
                    self.bucket,
                    options={"public": True}
                )
                logger.info(f"Bucket público '{self.bucket}' criado no Supabase Storage.")
        except Exception as e:
            logger.warning(f"Erro ao verificar/criar bucket '{self.bucket}': {e}")

    def upload_file(self, file_content: bytes, filename: str, content_type: str) -> str:
        """
        Faz o upload para o bucket media-library do Supabase Storage
        e retorna a URL pública acessível externamente.
        """
        try:
            storage_path = filename.lstrip("/")

            # Upsert true para permitir sobrescrita se o arquivo já existir
            self.client.storage.from_(self.bucket).upload(
                path=storage_path,
                file=file_content,
                file_options={
                    "content-type": content_type or "application/octet-stream",
                    "upsert": "true",
                },
            )

            public_url = f"{self.public_base_url}/storage/v1/object/public/{self.bucket}/{storage_path}"
            logger.info(f"[StorageService] Upload OK no Supabase Storage [{self.bucket}]: {public_url}")
            return public_url
        except Exception as e:
            logger.error(f"[StorageService] Erro no upload do Supabase Storage ({self.bucket}/{filename}): {e}")
            raise e

    def delete_file(self, filename: str) -> bool:
        """Remove um arquivo do bucket media-library."""
        try:
            storage_path = filename.lstrip("/")
            self.client.storage.from_(self.bucket).remove([storage_path])
            logger.info(f"[StorageService] Arquivo removido do Supabase Storage: {storage_path}")
            return True
        except Exception as e:
            logger.warning(f"[StorageService] Erro ao remover arquivo do Supabase Storage ({filename}): {e}")
            return False
