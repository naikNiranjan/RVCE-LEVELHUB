from supabase import create_client, Client
from app.config.settings import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_supabase_client():
    return supabase
