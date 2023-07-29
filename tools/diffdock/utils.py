# import sys
# import gradio as gr
import os

# import copy
# import os
# import torch

# import subprocess


# import time
# from argparse import ArgumentParser, Namespace, FileType
# from rdkit.Chem import RemoveHs
# from functools import partial
# import numpy as np
# import pandas as pd
# from rdkit import RDLogger
# from rdkit.Chem import MolFromSmiles, AddHs
# from torch_geometric.loader import DataLoader
# import yaml
# import sys
# import csv

# csv.field_size_limit(sys.maxsize)

# print(torch.__version__)
# os.makedirs("data/esm2_output", exist_ok=True)
# os.makedirs("results", exist_ok=True)
# from datasets.process_mols import (
#     read_molecule,
#     generate_conformer,
#     write_mol_with_coords,
# )
# from datasets.pdbbind import PDBBind
# from utils.diffusion_utils import t_to_sigma as t_to_sigma_compl, get_t_schedule
# from utils.sampling import randomize_position, sampling
# from utils.utils import get_model
# from utils.visualise import PDBFile
# from tqdm import tqdm
# from datasets.esm_embedding_preparation import esm_embedding_prep
# import subprocess


def get_pdb(pdb_code="", filepath=""):
    try:
        return filepath.name
    except AttributeError as e:
        if pdb_code is None or pdb_code == "":
            return None
        else:
            # print('in if condition')
            # print(os.system(f"wget -qnc https://files.rcsb.org/view/{pdb_code}.pdb"))
            return f"{pdb_code}.pdb"