import oloren as olo
import pandas as pd
import json
import requests
import xml.etree.ElementTree as ET


ENTREZ_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'


@olo.register(description="GET Request")
def get_request(text=olo.String()):
    response = requests.get(text)
    response.raise_for_status()
    return response.text

@olo.register(description="GET PDB Request from REST API")
def get_pdb(pdb_id=olo.String(), hierarchical_level=olo.String('entry'), identifier=olo.String()):
    # Define the base URL for the PDB REST API
    base_url = "https://data.rcsb.org/rest/v1/core"

    # Construct the full URL by adding the hierarchical_level, identifier, and pdb_id
    full_url = f"{base_url}/{hierarchical_level}/{pdb_id}/{identifier}"
    return full_url

@olo.register(description="GET Pubmed Request from REST API")
def search_entrez_db(database=olo.String(), query=olo.String()):
    full_url = f"{ENTREZ_BASE_URL}/esearch.fcgi?db={database}&term={query}"
    return full_url

@olo.register(description="Format UID List for Entrez Downloads")
def format_uid_list(entrez_search_xml=olo.String()):
    # Parse the XML string
    root = ET.fromstring(entrez_search_xml)

    # Find the <IdList> element
    id_list_elem = root.find('IdList')
    if id_list_elem is None:
        return ''

    # Extract all the UIDs into a list
    uids = [elem.text for elem in id_list_elem.findall('Id')]

    # Join the UIDs with commas
    formatted_uids = ','.join(uids)
    return formatted_uids

@olo.register(description="Download Entrez Records for UIDs")
def download_entrez_records_from_uid(database=olo.String(), uid_list=olo.String()): #, retrieval_type=olo.String(), retrieval_mode=olo.String()):
    #TODO: Assert `uid_list` in correct format.
    if uid_list == '':
        return 'No UIDs found.'
    full_url = f'{ENTREZ_BASE_URL}/efetch.fcgi?db={database}&id={uid_list}' #&rettype=<{retrieval_type}>&retmode=<{retrieval_mode}>'
    print(full_url)
    
    text = get_request(full_url)
    
    root = ET.fromstring(text)
    result = ''
    for item in root.findall('.//Article'):
        title = item.find('ArticleTitle')
        abstract = item.find('Abstract')
        abstract_text = ''

        if abstract is not None:
            for child in abstract:
                if child.tag == 'AbstractText':
                    label_text = child.get('Label', '')
                    
                    if child.text is not None:
                        abstract_text += label_text + ' ' + child.text + '\n'
                    
        if title is not None and abstract is not None:
            title_text = title.text if title.text is not None else ''
            result += title_text + '\n' + abstract_text + '\n=====\n'
    outputs = result
    return outputs

if __name__ == "__main__":
    olo.run("get_requests", port=2325)