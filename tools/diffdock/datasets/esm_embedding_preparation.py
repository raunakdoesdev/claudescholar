import os
from argparse import FileType, ArgumentParser

import numpy as np
import pandas as pd
from Bio.PDB import PDBParser
from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord
from tqdm import tqdm
from Bio import SeqIO



def esm_embedding_prep(out_file, protein_path):
    biopython_parser = PDBParser()

    three_to_one = {
        "ALA": "A",
        "ARG": "R",
        "ASN": "N",
        "ASP": "D",
        "CYS": "C",
        "GLN": "Q",
        "GLU": "E",
        "GLY": "G",
        "HIS": "H",
        "ILE": "I",
        "LEU": "L",
        "LYS": "K",
        "MET": "M",
        "MSE": "M",  # MSE this is almost the same AA as MET. The sulfur is just replaced by Selen
        "PHE": "F",
        "PRO": "P",
        "PYL": "O",
        "SER": "S",
        "SEC": "U",
        "THR": "T",
        "TRP": "W",
        "TYR": "Y",
        "VAL": "V",
        "ASX": "B",
        "GLX": "Z",
        "XAA": "X",
        "XLE": "J",
    }

    file_paths = [protein_path]
    sequences = []
    ids = []
    for file_path in tqdm(file_paths):
        structure = biopython_parser.get_structure("random_id", file_path)
        structure = structure[0]
        for i, chain in enumerate(structure):
            seq = ""
            for res_idx, residue in enumerate(chain):
                if residue.get_resname() == "HOH":
                    continue
                residue_coords = []
                c_alpha, n, c = None, None, None
                for atom in residue:
                    if atom.name == "CA":
                        c_alpha = list(atom.get_vector())
                    if atom.name == "N":
                        n = list(atom.get_vector())
                    if atom.name == "C":
                        c = list(atom.get_vector())
                if (
                    c_alpha != None and n != None and c != None
                ):  # only append residue if it is an amino acid
                    try:
                        seq += three_to_one[residue.get_resname()]
                    except Exception as e:
                        seq += "-"
                        print(
                            "encountered unknown AA: ",
                            residue.get_resname(),
                            " in the complex ",
                            file_path,
                            ". Replacing it with a dash - .",
                        )
            sequences.append(seq)
            ids.append(f"{os.path.basename(file_path)}_chain_{i}")
    records = []
    for (index, seq) in zip(ids, sequences):
        record = SeqRecord(Seq(seq), str(index))
        record.description = ""
        records.append(record)
    SeqIO.write(records, out_file, "fasta")
