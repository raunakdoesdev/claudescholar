import modal
from argparse import ArgumentParser, Namespace, FileType
import yaml

stub = modal.Stub("DiffDock")

image = (
    modal.Image.micromamba(python_version="3.9")
    .apt_install('curl')  # add curl which is necessary to download micromamba
    .apt_install('wget')  # add wget which is necessary to download micromamba
    .apt_install('bzip2')  # add bzip2 which is necessary to unpack micromamba
    .apt_install('g++') 
    .apt_install('git')
)

image = image.micromamba_install(
    "pytorch==1.11.0",
    "pytorch-cuda=11.7",
   channels=["pytorch", "nvidia", "anaconda"] #"anaconda", "conda_forge"],
).pip_install(
    "torch-scatter",
    "torch-sparse",
    "torch-cluster",
    "torch-spline-conv",
    "torch-geometric==2.0.4",
    find_links="https://data.pyg.org/whl/torch-1.11.0+cu117.html",
).pip_install(
    'PyYAML',
    'scipy',
    'networkx[default]',
    'biopython',
    'rdkit-pypi',
    'e3nn',
    'spyrmsd',
    'pandas',
    'biopandas'
)

image = image.run_commands(
    'export CUDA_HOME=/usr/local/cuda-11.7'
)

image = image.pip_install(
    "fair-esm[esmfold]",
    'dllogger @ git+https://github.com/NVIDIA/dllogger.git',
    # 'openfold @ git+https://github.com/aqlaboratory/openfold.git@4b41059694619831a7db195b7e0988fc4ff3a307',
)


    
# image = image.run_function(download_workdir)

stub.image = image
if stub.is_inside():
    import sys
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
    import yaml
    import csv

@stub.function(image=image)
def get_pdb(pdb_code="", filepath=""):
    try:
        return filepath.name
    except AttributeError as e:
        if pdb_code is None or pdb_code == "":
            return None
        else:
            os.system(f"wget -qnc https://files.rcsb.org/view/{pdb_code}.pdb")
            return f"{pdb_code}.pdb"

@stub.function(image=image)
def get_ligand(smiles="", filepath=""):
    if smiles is None or smiles == "":
        try:
            return filepath.name
        except AttributeError as e:
            return None
    else:
        return smiles

@stub.function(image=image)
def read_mol(molpath):
    with open(molpath, "r") as fp:
        lines = fp.readlines()
    mol = ""
    for l in lines:
        mol += l
    return mol

@stub.function(image=image)
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

@stub.function(image=image)
def esm(protein_path, out_file):
    import subprocess
    from datasets.esm_embedding_preparation import esm_embedding_prep

    print("running esm")
    esm_embedding_prep(out_file, protein_path)
    # create args object with defaults
    os.environ["HOME"] = "esm/model_weights"
    subprocess.call(
        f"python esm/scripts/extract.py esm2_t33_650M_UR50D {out_file} data/esm2_output --repr_layers 33 --include per_tok",
        shell=True,
        env=os.environ,
    )




# conda install pytorch==1.11.0 pytorch-cuda=11.7 -c pytorch -c nvidia
# pip install torch-scatter torch-sparse torch-cluster torch-spline-conv torch-geometric==2.0.4 -f https://data.pyg.org/whl/torch-1.11.0+cu117.html
# python -m pip install PyYAML scipy "networkx[default]" biopython rdkit-pypi e3nn spyrmsd pandas biopandas

# pymc_image = modal.Image.conda().conda_install(
#     packages=["theano-pymc==1.1.2", "pymc3==3.11.2"],
#     channels=[],
# )


# @stub.function(image=image)
# @web_endpoint(label="foo-bar")

@stub.cls(gpu="a100")
class DiffDock:
    def __enter__(self, score_model_args, confidence_args):
        print( "Entering")
        csv.field_size_limit(sys.maxsize)

        print(torch.__version__)
        os.makedirs("data/esm2_output", exist_ok=True)
        os.makedirs("results", exist_ok=True)
        
        print(f'{os.getcwd()}')
        print(f'{os.listdir()}')


        import shutil
        from utils.diffusion_utils import t_to_sigma as t_to_sigma_compl, get_t_schedule
        from utils.utils import get_model


        self.score_model_args = score_model_args
        self.confidence_args = confidence_args
        
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        t_to_sigma = partial(t_to_sigma_compl, args=self.score_model_args)

        self.model = get_model(self.score_model_args, device, t_to_sigma=t_to_sigma, no_parallel=True)
        state_dict = torch.load(
            f"./workdir/paper_score_self.model/best_ema_inference_epoch_model.pt",
            map_location=torch.device("cpu"),
        )
        self.model.load_state_dict(state_dict, strict=True)
        self.model = self.model.to(device)
        self.model.eval()

        self.confidence_model = get_model(
            self.confidence_args,
            device,
            t_to_sigma=t_to_sigma,
            no_parallel=True,
            confidence_mode=True,
        )
        state_dict = torch.load(
            f"./workdir/paper_confidence_model/best_model_epoch75.pt",
            map_location=torch.device("cpu"),
        )
        self.confidence_model.load_state_dict(state_dict, strict=True)
        self.confidence_model = self.confidence_model.to(device)
        self.confidence_model.eval()

    
    @modal.method()
    def update(self, inp, file, ligand_inp, ligand_file, n_it, n_samples, actual_steps, no_final_step_noise):
        from utils.diffusion_utils import t_to_sigma as t_to_sigma_compl, get_t_schedule
        from datasets.pdbbind import PDBBind
        import shutil
        from utils.sampling import randomize_position, sampling
        from utils.visualise import PDBFile
        from torch_geometric.loader import DataLoader
        from datasets.process_mols import (
            write_mol_with_coords,
        )
        from tqdm import tqdm
        
        t_to_sigma = partial(t_to_sigma_compl, args=self.score_model_args)
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        pdb_path = get_pdb(inp)
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
            receptor_radius=self.score_model_args.receptor_radius,
            cache_path="data/cache",
            remove_hs=self.score_model_args.remove_hs,
            max_lig_size=None,
            c_alpha_max_neighbors=self.score_model_args.c_alpha_max_neighbors,
            matching=False,
            keep_original=False,
            popsize=self.score_model_args.matching_popsize,
            maxiter=self.score_model_args.matching_maxiter,
            all_atoms=self.score_model_args.all_atoms,
            atom_radius=self.score_model_args.atom_radius,
            atom_max_neighbors=self.score_model_args.atom_max_neighbors,
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
            receptor_radius=self.confidence_args.receptor_radius,
            cache_path="data/cache",
            remove_hs=self.confidence_args.remove_hs,
            max_lig_size=None,
            c_alpha_max_neighbors=self.confidence_args.c_alpha_max_neighbors,
            matching=False,
            keep_original=False,
            popsize=self.confidence_args.matching_popsize,
            maxiter=self.confidence_args.matching_maxiter,
            all_atoms=self.confidence_args.all_atoms,
            atom_radius=self.confidence_args.atom_radius,
            atom_max_neighbors=self.confidence_args.atom_max_neighbors,
            esm_embeddings_path="data/esm2_output",
            require_ligand=True,
            num_workers=1,
        )
        confidence_complex_dict = {d.name: d for d in confidence_test_dataset}
        for idx, orig_complex_graph in tqdm(enumerate(test_loader)):
            if (
                self.confidence_model is not None
                and not (
                    self.confidence_args.use_original_model_cache
                    or self.confidence_args.transfer_weights
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
                    self.score_model_args.no_torsion,
                    no_random,
                    self.score_model_args.tr_sigma_max,
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
                if self.confidence_model is not None and not (
                    self.confidence_args.use_original_model_cache
                    or self.confidence_args.transfer_weights
                ):
                    confidence_data_list = [
                        copy.deepcopy(confidence_complex_dict[orig_complex_graph.name[0]])
                        for _ in range(N)
                    ]
                else:
                    confidence_data_list = None

                data_list, confidence = sampling(
                    data_list=data_list,
                    model=self.model,
                    inference_steps=actual_steps,
                    tr_schedule=tr_schedule,
                    rot_schedule=rot_schedule,
                    tor_schedule=tor_schedule,
                    device=device,
                    t_to_sigma=t_to_sigma,
                    model_args=self.score_model_args,
                    no_random=no_random,
                    ode=ode,
                    visualization_list=visualization_list,
                    confidence_model=self.confidence_model,
                    confidence_data_list=confidence_data_list,
                    confidence_model_args=self.confidence_args,
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
                    self.confidence_args.rmsd_classification_cutoff, list
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
                    if self.score_model_args.remove_hs:
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

    # torch.cuda.empty_cache()
        return (
            # pdb_path
            molecule(pdb_path, filenames[0], ligand_file),
            # gr.Dropdown.update(choices=labels, value=labels[0]),
            # filenames,
            # pdb_path,
            # zippath,
        )
        

@stub.local_entrypoint()
def main():
    pdb_code = '6w70'
    pdb_file = ''
    ligand_smiles_str = 'COc1ccc(cc1)n2c3c(c(n2)C(=O)N)CCN(C3=O)c4ccc(cc4)N5CCCCC5=O'
    ligand_file = ''
    n_it, n_samples, actual_steps, no_final_step_noise = 20, 10, 18, True
    
    with open(f"./workdir/paper_score_model/model_parameters.yml") as f:
        score_model_args = Namespace(**yaml.full_load(f))

    with open(f"./workdir/paper_confidence_model/model_parameters.yml") as f:
        confidence_args = Namespace(**yaml.full_load(f))
    
    diffdock = DiffDock(score_model_args, confidence_args)

    molecule = diffdock.update.call(pdb_code, pdb_file, ligand_smiles_str, ligand_file, n_it, n_samples, actual_steps, no_final_step_noise)
    print(molecule)
