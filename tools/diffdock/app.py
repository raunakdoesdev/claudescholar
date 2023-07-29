import gradio as gr
import os

import copy
import os
import torch

import subprocess


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
import sys
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

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

with open(f"workdir/paper_score_model/model_parameters.yml") as f:
    score_model_args = Namespace(**yaml.full_load(f))

with open(f"workdir/paper_confidence_model/model_parameters.yml") as f:
    confidence_args = Namespace(**yaml.full_load(f))

import shutil

t_to_sigma = partial(t_to_sigma_compl, args=score_model_args)

model = get_model(score_model_args, device, t_to_sigma=t_to_sigma, no_parallel=True)
state_dict = torch.load(
    f"workdir/paper_score_model/best_ema_inference_epoch_model.pt",
    map_location=torch.device("cpu"),
)
model.load_state_dict(state_dict, strict=True)
model = model.to(device)
model.eval()

confidence_model = get_model(
    confidence_args,
    device,
    t_to_sigma=t_to_sigma,
    no_parallel=True,
    confidence_mode=True,
)
state_dict = torch.load(
    f"workdir/paper_confidence_model/best_model_epoch75.pt",
    map_location=torch.device("cpu"),
)
confidence_model.load_state_dict(state_dict, strict=True)
confidence_model = confidence_model.to(device)
confidence_model.eval()


def get_pdb(pdb_code="", filepath=""):
    try:
        return filepath.name
    except AttributeError as e:
        if pdb_code is None or pdb_code == "":
            return None
        else:
            os.system(f"wget -qnc https://files.rcsb.org/view/{pdb_code}.pdb")
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


import sys


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


def update(inp, file, ligand_inp, ligand_file, n_it, n_samples, actual_steps, no_final_step_noise):
    pdb_path = get_pdb(inp, file)
    ligand_path = get_ligand(ligand_inp, ligand_file)

    esm(
        pdb_path,
        f"data/{os.path.basename(pdb_path)}_prepared_for_esm.fasta",
    )
    tr_schedule = get_t_schedule(inference_steps=n_it)
    rot_schedule = tr_schedule
    tor_schedule = tr_schedule
    print("common t schedule", tr_schedule)
    (
        failures,
        skipped,
        confidences_list,
        names_list,
        run_times,
        min_self_distances_list,
    ) = (
        0,
        0,
        [],
        [],
        [],
        [],
    )
    N = n_samples  # number of samples to generate
    protein_path_list = [pdb_path]
    ligand_descriptions = [ligand_path]
    no_random = False
    ode = False
    no_final_step_noise = no_final_step_noise
    out_dir = "results/"
    test_dataset = PDBBind(
        transform=None,
        root="",
        protein_path_list=protein_path_list,
        ligand_descriptions=ligand_descriptions,
        receptor_radius=score_model_args.receptor_radius,
        cache_path="data/cache",
        remove_hs=score_model_args.remove_hs,
        max_lig_size=None,
        c_alpha_max_neighbors=score_model_args.c_alpha_max_neighbors,
        matching=False,
        keep_original=False,
        popsize=score_model_args.matching_popsize,
        maxiter=score_model_args.matching_maxiter,
        all_atoms=score_model_args.all_atoms,
        atom_radius=score_model_args.atom_radius,
        atom_max_neighbors=score_model_args.atom_max_neighbors,
        esm_embeddings_path="data/esm2_output",
        require_ligand=True,
        num_workers=1,
        keep_local_structures=False,
    )
    test_loader = DataLoader(dataset=test_dataset, batch_size=1, shuffle=False)
    confidence_test_dataset = PDBBind(
        transform=None,
        root="",
        protein_path_list=protein_path_list,
        ligand_descriptions=ligand_descriptions,
        receptor_radius=confidence_args.receptor_radius,
        cache_path="data/cache",
        remove_hs=confidence_args.remove_hs,
        max_lig_size=None,
        c_alpha_max_neighbors=confidence_args.c_alpha_max_neighbors,
        matching=False,
        keep_original=False,
        popsize=confidence_args.matching_popsize,
        maxiter=confidence_args.matching_maxiter,
        all_atoms=confidence_args.all_atoms,
        atom_radius=confidence_args.atom_radius,
        atom_max_neighbors=confidence_args.atom_max_neighbors,
        esm_embeddings_path="data/esm2_output",
        require_ligand=True,
        num_workers=1,
    )
    confidence_complex_dict = {d.name: d for d in confidence_test_dataset}
    for idx, orig_complex_graph in tqdm(enumerate(test_loader)):
        if (
            confidence_model is not None
            and not (
                confidence_args.use_original_model_cache
                or confidence_args.transfer_weights
            )
            and orig_complex_graph.name[0] not in confidence_complex_dict.keys()
        ):
            skipped += 1
            print(
                f"HAPPENING | The confidence dataset did not contain {orig_complex_graph.name[0]}. We are skipping this complex."
            )
            continue
        try:
            data_list = [copy.deepcopy(orig_complex_graph) for _ in range(N)]
            randomize_position(
                data_list,
                score_model_args.no_torsion,
                no_random,
                score_model_args.tr_sigma_max,
            )
            pdb = None
            lig = orig_complex_graph.mol[0]
            visualization_list = []
            for graph in data_list:
                pdb = PDBFile(lig)
                pdb.add(lig, 0, 0)
                pdb.add(
                    (
                        orig_complex_graph["ligand"].pos
                        + orig_complex_graph.original_center
                    )
                    .detach()
                    .cpu(),
                    1,
                    0,
                )
                pdb.add(
                    (graph["ligand"].pos + graph.original_center).detach().cpu(),
                    part=1,
                    order=1,
                )
                visualization_list.append(pdb)

            start_time = time.time()
            if confidence_model is not None and not (
                confidence_args.use_original_model_cache
                or confidence_args.transfer_weights
            ):
                confidence_data_list = [
                    copy.deepcopy(confidence_complex_dict[orig_complex_graph.name[0]])
                    for _ in range(N)
                ]
            else:
                confidence_data_list = None

            data_list, confidence = sampling(
                data_list=data_list,
                model=model,
                inference_steps=actual_steps,
                tr_schedule=tr_schedule,
                rot_schedule=rot_schedule,
                tor_schedule=tor_schedule,
                device=device,
                t_to_sigma=t_to_sigma,
                model_args=score_model_args,
                no_random=no_random,
                ode=ode,
                visualization_list=visualization_list,
                confidence_model=confidence_model,
                confidence_data_list=confidence_data_list,
                confidence_model_args=confidence_args,
                batch_size=1,
                no_final_step_noise=no_final_step_noise,
            )
            ligand_pos = np.asarray(
                [
                    complex_graph["ligand"].pos.cpu().numpy()
                    + orig_complex_graph.original_center.cpu().numpy()
                    for complex_graph in data_list
                ]
            )
            run_times.append(time.time() - start_time)

            if confidence is not None and isinstance(
                confidence_args.rmsd_classification_cutoff, list
            ):
                confidence = confidence[:, 0]
            if confidence is not None:
                confidence = confidence.cpu().numpy()
                re_order = np.argsort(confidence)[::-1]
                confidence = confidence[re_order]
                confidences_list.append(confidence)
                ligand_pos = ligand_pos[re_order]
            write_dir = (
                f'{out_dir}/index{idx}_{data_list[0]["name"][0].replace("/","-")}'
            )
            os.makedirs(write_dir, exist_ok=True)
            confidences = []
            for rank, pos in enumerate(ligand_pos):
                mol_pred = copy.deepcopy(lig)
                if score_model_args.remove_hs:
                    mol_pred = RemoveHs(mol_pred)
                if rank == 0:
                    write_mol_with_coords(
                        mol_pred, pos, os.path.join(write_dir, f"rank{rank+1}.sdf")
                    )
                confidences.append(confidence[rank])
                write_mol_with_coords(
                    mol_pred,
                    pos,
                    os.path.join(
                        write_dir, f"rank{rank+1}_confidence{confidence[rank]:.2f}.sdf"
                    ),
                )
            self_distances = np.linalg.norm(
                ligand_pos[:, :, None, :] - ligand_pos[:, None, :, :], axis=-1
            )
            self_distances = np.where(
                np.eye(self_distances.shape[2]), np.inf, self_distances
            )
            min_self_distances_list.append(np.min(self_distances, axis=(1, 2)))

            filenames = []
            if confidence is not None:
                for rank, batch_idx in enumerate(re_order):
                    visualization_list[batch_idx].write(
                        os.path.join(write_dir, f"rank{rank+1}_reverseprocess.pdb")
                    )
                    filenames.append(
                        os.path.join(write_dir, f"rank{rank+1}_reverseprocess.pdb")
                    )
            else:
                for rank, batch_idx in enumerate(ligand_pos):
                    visualization_list[batch_idx].write(
                        os.path.join(write_dir, f"rank{rank+1}_reverseprocess.pdb")
                    )
                    filenames.append(
                        os.path.join(write_dir, f"rank{rank+1}_reverseprocess.pdb")
                    )
            names_list.append(orig_complex_graph.name[0])
        except Exception as e:
            print("Failed on", orig_complex_graph["name"], e)
            failures += 1
            return None
    # zip outputs
    zippath = shutil.make_archive(
        os.path.join("results", os.path.basename(pdb_path)), "zip", write_dir
    )
    print("Zipped outputs to", zippath)
    labels = [
        f"rank {i+1}, confidence {confidences[i]:.2f}" for i in range(len(filenames))
    ]

    torch.cuda.empty_cache()
    return (
        molecule(pdb_path, filenames[0], ligand_file),
        gr.Dropdown.update(choices=labels, value=labels[0]),
        filenames,
        pdb_path,
        zippath,
    )


def updateView(out, filenames, pdb, ligand_file):
    print("updating view")
    i = out  # int(out.replace("rank", ""))
    print(i)
    i = int(i.split(",")[0].replace("rank", "")) - 1
    return molecule(pdb, filenames[i], ligand_file)


demo = gr.Blocks()

with demo:
    gr.Markdown("# DiffDock")
    gr.Markdown(
        ">**DiffDock: Diffusion Steps, Twists, and Turns for Molecular Docking**, Corso, Gabriele and Stärk, Hannes and Jing, Bowen and Barzilay, Regina and Jaakkola, Tommi, arXiv:2210.01776  [GitHub](https://github.com/gcorso/diffdock)"
    )
    gr.Markdown("")
    with gr.Box():
        with gr.Row():
            with gr.Column():
                gr.Markdown("## Protein")
                inp = gr.Textbox(
                    placeholder="PDB Code or upload file below", label="Input structure"
                )
                file = gr.File(file_count="single", label="Input PDB")
            with gr.Column():
                gr.Markdown("## Ligand")
                ligand_inp = gr.Textbox(
                    placeholder="Provide SMILES input or upload mol2/sdf file below",
                    label="SMILES string",
                )
                ligand_file = gr.File(file_count="single", label="Input Ligand")
        n_it = gr.Slider(value=20,
            minimum=10, maximum=40, label="Number of inference steps", step=1
        )
        actual_steps = gr.Slider(value=18,
            minimum=10, maximum=40, label="Number of actual inference steps", step=1
        )
        n_samples = gr.Slider(value=40,
            minimum=10, maximum=40, label="Number of samples", step=1
        )
        no_final_step_noise = gr.Checkbox(value=True,label="No final step noise"
        )

    btn = gr.Button("Run predictions")

    gr.Markdown("## Output")
    pdb = gr.Variable()
    filenames = gr.Variable()
    out = gr.Dropdown(interactive=True, label="Ranked samples")
    mol = gr.HTML()
    output_file = gr.File(file_count="single", label="Output files")
    gr.Examples(
        [
            [
                "6w70",
                "examples/6w70.pdb",
                "COc1ccc(cc1)n2c3c(c(n2)C(=O)N)CCN(C3=O)c4ccc(cc4)N5CCCCC5=O",
                "examples/6w70_ligand.sdf",
                20,
                10,
                18,
                True
            ],
            [
                "6moa",
                "examples/6moa_protein_processed.pdb",
                "",
                "examples/6moa_ligand.sdf",
                20,
                10,
                18,
                True
            ],
            [
                "",
                "examples/6o5u_protein_processed.pdb",
                "",
                "examples/6o5u_ligand.sdf",
                20,
                10,
                18,
                True
            ],
            [
                "",
                "examples/6o5u_protein_processed.pdb",
                "[NH3+]C[C@H]1O[C@H](O[C@@H]2[C@@H]([NH3+])C[C@H]([C@@H]([C@H]2O)O[C@H]2O[C@H](CO)[C@H]([C@@H]([C@H]2O)[NH3+])O)[NH3+])[C@@H]([C@H]([C@@H]1O)O)O",
                "examples/6o5u_ligand.sdf",
                20,
                10,
                18,
                True
            ],
            [
                "",
                "examples/6o5u_protein_processed.pdb",
                "",
                "examples/6o5u_ligand.sdf",
                20,
                10,
                18,
                True
            ],
            [
                "",
                "examples/6ahs_protein_processed.pdb",
                "",
                "examples/6ahs_ligand.sdf",
                20,
                10,
                18,
                True
            ],
        ],
        [inp, file, ligand_inp, ligand_file, n_it, n_samples, actual_steps, no_final_step_noise],
        [mol, out, filenames, pdb, output_file],
        # fn=update,
        # cache_examples=True,
    )
    btn.click(
        fn=update,
        inputs=[inp, file, ligand_inp, ligand_file, n_it, n_samples, actual_steps, no_final_step_noise],
        outputs=[mol, out, filenames, pdb, output_file],
    )
    out.change(fn=updateView, inputs=[out, filenames, pdb, ligand_file], outputs=mol)
demo.launch()
