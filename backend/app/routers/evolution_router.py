import os
import secrets
import logging
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any
from app.services.evolution import EvolutionAdminAPI

logger = logging.getLogger("seufluxo.evolution_router")

router = APIRouter(prefix="/api/evolution", tags=["Evolution"])

class CreateInstanceRequest(BaseModel):
    instance_name: str
    token: str

def get_webhook_url() -> str:
    base = os.getenv("WEBHOOK_BASE_URL", "https://apifluxo.transformafuturo.com.br").rstrip("/")
    return f"{base}/api/webhook/evolution"

@router.post("/create", response_model=Dict[str, Any])
async def create_instance(request: CreateInstanceRequest):
    """
    Cria uma nova instância na Evolution API e configura o Webhook.
    """
    admin_api = EvolutionAdminAPI()
    response = await admin_api.create_instance(request.instance_name, request.token)
    
    if "error" in response:
        raise HTTPException(status_code=400, detail=response["error"])
        
    # Configura o Webhook automaticamente
    webhook_url = get_webhook_url()
    await admin_api.set_webhook(request.instance_name, webhook_url)
    logger.info(f"Instância {request.instance_name} criada e webhook configurado para {webhook_url}")
    
    return response

@router.get("/connect/{instance_name}", response_model=Dict[str, Any])
async def connect_instance(instance_name: str):
    """
    Gera o QR Code para conectar a instância.
    Se a instância não existir na Evolution API, recria-a automaticamente.
    """
    admin_api = EvolutionAdminAPI()
    response = await admin_api.connect_instance(instance_name)
    
    # Auto-recuperação caso a instância tenha sido deletada ou reiniciada na Evolution API
    if "error" in response and ("does not exist" in str(response["error"]).lower() or "not found" in str(response["error"]).lower()):
        logger.warning(f"Instância '{instance_name}' não existe na Evolution API. Recriando automaticamente...")
        token = secrets.token_hex(8)
        create_res = await admin_api.create_instance(instance_name, token)
        if "error" not in create_res:
            webhook_url = get_webhook_url()
            await admin_api.set_webhook(instance_name, webhook_url)
            # Tenta conectar novamente
            response = await admin_api.connect_instance(instance_name)
    
    if "error" in response:
        raise HTTPException(status_code=400, detail=response["error"])
        
    return response

@router.get("/status/{instance_name}", response_model=Dict[str, Any])
async def connection_status(instance_name: str):
    """
    Verifica o status da conexão da instância.
    """
    admin_api = EvolutionAdminAPI()
    response = await admin_api.connection_state(instance_name)
    
    if "error" in response:
        # Se não existe, retorna estado desconectado amigável
        if "does not exist" in str(response["error"]).lower() or "not found" in str(response["error"]).lower():
            return {"instance": {"state": "close"}}
        raise HTTPException(status_code=400, detail=response["error"])
        
    return response

@router.delete("/delete/{instance_name}", response_model=Dict[str, Any])
async def delete_instance(instance_name: str):
    """
    Deleta a instância na Evolution API.
    """
    admin_api = EvolutionAdminAPI()
    
    url_logout = f"{admin_api.base_url}/instance/logout/{instance_name}"
    url_delete = f"{admin_api.base_url}/instance/delete/{instance_name}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            await client.delete(url_logout, headers=admin_api.headers)
            resp = await client.delete(url_delete, headers=admin_api.headers)
            resp.raise_for_status()
            return {"success": True, "detail": "Instance deleted"}
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=str(e))
