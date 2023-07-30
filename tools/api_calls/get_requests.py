import oloren as olo
import pandas as pd
import json
import requests


@olo.register(description="GET Request")
def get_request(text=olo.String()):
    response = requests.get(text)
    response.raise_for_status()
    return response.json()

@olo.register(description="GET PDB Request from REST API")
def get_pdb(pdb_id=olo.String(), hierarchical_level=olo.String('entry'), identifier=olo.String()):
    # Define the base URL for the PDB REST API
    base_url = "https://data.rcsb.org/rest/v1/core"

    # Construct the full URL by adding the hierarchical_level, identifier, and pdb_id
    full_url = f"{base_url}/{hierarchical_level}/{pdb_id}/{identifier}"

    return full_url

@olo.register(description="GET Pubmed Request from REST API")
def search_entrez_db(database=olo.String(), query=olo.String()):
    
    base_url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
    
    full_url = f"{base_url}/esearch.fcgi?db=<{database}>&term=<{query}>"
    return full_url


if __name__ == "__main__":
    olo.run("pdb_rest_api", port=2325)