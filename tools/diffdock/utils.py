import sys
# import gradio as gr
import os

import copy
import torch


import time
from argparse import ArgumentParser, Namespace, FileType
from rdkit.Chem import RemoveHs
from functools import partial
import numpy as np
import pandas as pd
from rdkit import RDLogger
from rdkit.Chem import MolFromSmiles, AddHs
from torch_geometric.loader import DataLoader
import yaml
import csv

csv.field_size_limit(sys.maxsize)

print(torch.__version__)
os.makedirs("data/esm2_output", exist_ok=True)
os.makedirs("results", exist_ok=True)
from datasets.process_mols import (
    read_molecule,
    generate_conformer,
    write_mol_with_coords,
)
from datasets.pdbbind import PDBBind
from utils.diffusion_utils import t_to_sigma as t_to_sigma_compl, get_t_schedule
from utils.sampling import randomize_position, sampling
from utils.utils import get_model
from utils.visualise import PDBFile
from tqdm import tqdm
from datasets.esm_embedding_preparation import esm_embedding_prep
import subprocess


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
        
def get_ligand(smiles="", filepath=""):
    if smiles is None or smiles == "":
        try:
            return filepath.name
        except AttributeError as e:
            return None
    else:
        return smiles


def read_mol(molpath):
    with open(molpath, "r") as fp:
        lines = fp.readlines()
    mol = ""
    for l in lines:
        mol += l
    return mol


def molecule(input_pdb, ligand_pdb, original_ligand):

    structure = read_mol(input_pdb)
    mol = read_mol(ligand_pdb)

    try:
        ligand = read_mol(original_ligand.name)
        _, ext = os.path.splitext(original_ligand.name)
        lig_str_1 = """let original_ligand = `""" + ligand + """`"""
        lig_str_2 = f"""
        viewer.addModel( original_ligand, "{ext[1:]}" );
        viewer.getModel(2).setStyle({{stick:{{colorscheme:"greenCarbon"}}}});"""
    except AttributeError as e:
        ligand = None
        lig_str_1 = ""
        lig_str_2 = ""

    x = (
        """<!DOCTYPE html>
        <html>
        <head>    
    <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
    <style>
    body{
        font-family:sans-serif
    }
    .mol-container {
    width: 600px;
    height: 600px;
    position: relative;
    mx-auto:0
    }
    .mol-container select{
        background-image:None;
    }
    .green{
        width:20px;
        height:20px;
        background-color:#33ff45;
        display:inline-block;
    }
    .magenta{
        width:20px;
        height:20px;
        background-color:magenta;
        display:inline-block;
    }
    </style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.3/jquery.min.js" integrity="sha512-STof4xm1wgkfm7heWqFJVn58Hm3EtS31XFaagaa8VMReCXAkQnJZ+jEy8PCC/iT18dFy95WcExNHFTqLyp72eQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://3Dmol.csb.pitt.edu/build/3Dmol-min.js"></script>
    </head>
    <body>  
     <button id="startanimation">Replay diffusion process</button> 
     <button id="togglesurface">Toggle surface representation</button> 
     <div>
     <span class="green"></span> Uploaded ligand position
     <span class="magenta"></span> Predicted ligand position
     </div>
    <div id="container" class="mol-container"></div>
  
            <script>
               let ligand = `"""
        + mol
        + """`  
        let structure = `"""
        + structure
        + """`
        """
        + lig_str_1
        + """
      
             let viewer = null;
             let surface = false;
             let surf = null;
             $(document).ready(function () {
                let element = $("#container");
                let config = { backgroundColor: "white" };
                viewer = $3Dmol.createViewer(element, config);
                viewer.addModel( structure, "pdb" );
                viewer.setStyle({}, {cartoon: {color: "gray"}});
                viewer.zoomTo();
                viewer.zoom(0.7);
                viewer.addModelsAsFrames(ligand, "pdb");
                viewer.animate({loop: "forward",reps: 1});
                
                viewer.getModel(1).setStyle({stick:{colorscheme:"magentaCarbon"}});
                """
        + lig_str_2
        + """
                viewer.render();
                
              })

              $("#startanimation").click(function() {
                viewer.animate({loop: "forward",reps: 1});
              });
              $("#togglesurface").click(function() {
               if (surface != true) {
                    surf = viewer.addSurface($3Dmol.SurfaceType.VDW, { "opacity": 0.9, "color": "white" }, { model: 0 });  
                    surface = true;
                } else {
                    viewer.removeAllSurfaces()
                    surface = false;
                }
              });
        </script>
        </body></html>"""
    )

    return f"""<iframe style="width: 100%; height: 700px" name="result" allow="midi; geolocation; microphone; camera; 
    display-capture; encrypted-media;" sandbox="allow-modals allow-forms 
    allow-scripts allow-same-origin allow-popups 
    allow-top-navigation-by-user-activation allow-downloads" allowfullscreen="" 
    allowpaymentrequest="" frameborder="0" srcdoc='{x}'></iframe>"""


def esm(protein_path, out_file):
    print("running esm")
    esm_embedding_prep(out_file, protein_path)
    # create args object with defaults
    os.environ["HOME"] = "esm/model_weights"
    subprocess.call(
        f"python esm/scripts/extract.py esm2_t33_650M_UR50D {out_file} data/esm2_output --repr_layers 33 --include per_tok",
        shell=True,
        env=os.environ,
    )