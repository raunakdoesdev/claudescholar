import modal
# from utils import get_pdb

stub = modal.Stub("DiffDock")

@stub.function()
def update():#inp, file):# file, ligand_inp, ligand_file, n_it, n_samples, actual_steps, no_final_step_noise):
    print('hello world')
    # pdb_path = get_pdb(inp, file)
    # ligand_path = get_ligand(ligand_inp, ligand_file)

    # esm(
    #     pdb_path,
    #     f"data/{os.path.basename(pdb_path)}_prepared_for_esm.fasta",
    # )
    # tr_schedule = get_t_schedule(inference_steps=n_it)
    # rot_schedule = tr_schedule
    # tor_schedule = tr_schedule
    # print("common t schedule", tr_schedule)
    # (
    #     failures,
    #     skipped,
    #     confidences_list,
    #     names_list,
    #     run_times,
    #     min_self_distances_list,
    # ) = (
    #     0,
    #     0,
    #     [],
    #     [],
    #     [],
    #     [],
    # )
    # N = n_samples  # number of samples to generate
    # protein_path_list = [pdb_path]
    # ligand_descriptions = [ligand_path]
    # no_random = False
    # ode = False
    # no_final_step_noise = no_final_step_noise
    # out_dir = "results/"
    # test_dataset = PDBBind(
    #     transform=None,
    #     root="",
    #     protein_path_list=protein_path_list,
    #     ligand_descriptions=ligand_descriptions,
    #     receptor_radius=score_model_args.receptor_radius,
    #     cache_path="data/cache",
    #     remove_hs=score_model_args.remove_hs,
    #     max_lig_size=None,
    #     c_alpha_max_neighbors=score_model_args.c_alpha_max_neighbors,
    #     matching=False,
    #     keep_original=False,
    #     popsize=score_model_args.matching_popsize,
    #     maxiter=score_model_args.matching_maxiter,
    #     all_atoms=score_model_args.all_atoms,
    #     atom_radius=score_model_args.atom_radius,
    #     atom_max_neighbors=score_model_args.atom_max_neighbors,
    #     esm_embeddings_path="data/esm2_output",
    #     require_ligand=True,
    #     num_workers=1,
    #     keep_local_structures=False,
    # )
    # test_loader = DataLoader(dataset=test_dataset, batch_size=1, shuffle=False)
    # confidence_test_dataset = PDBBind(
    #     transform=None,
    #     root="",
    #     protein_path_list=protein_path_list,
    #     ligand_descriptions=ligand_descriptions,
    #     receptor_radius=confidence_args.receptor_radius,
    #     cache_path="data/cache",
    #     remove_hs=confidence_args.remove_hs,
    #     max_lig_size=None,
    #     c_alpha_max_neighbors=confidence_args.c_alpha_max_neighbors,
    #     matching=False,
    #     keep_original=False,
    #     popsize=confidence_args.matching_popsize,
    #     maxiter=confidence_args.matching_maxiter,
    #     all_atoms=confidence_args.all_atoms,
    #     atom_radius=confidence_args.atom_radius,
    #     atom_max_neighbors=confidence_args.atom_max_neighbors,
    #     esm_embeddings_path="data/esm2_output",
    #     require_ligand=True,
    #     num_workers=1,
    # )
    # confidence_complex_dict = {d.name: d for d in confidence_test_dataset}
    # for idx, orig_complex_graph in tqdm(enumerate(test_loader)):
    #     if (
    #         confidence_model is not None
    #         and not (
    #             confidence_args.use_original_model_cache
    #             or confidence_args.transfer_weights
    #         )
    #         and orig_complex_graph.name[0] not in confidence_complex_dict.keys()
    #     ):
    #         skipped += 1
    #         print(
    #             f"HAPPENING | The confidence dataset did not contain {orig_complex_graph.name[0]}. We are skipping this complex."
    #         )
    #         continue
    #     try:
    #         data_list = [copy.deepcopy(orig_complex_graph) for _ in range(N)]
    #         randomize_position(
    #             data_list,
    #             score_model_args.no_torsion,
    #             no_random,
    #             score_model_args.tr_sigma_max,
    #         )
    #         pdb = None
    #         lig = orig_complex_graph.mol[0]
    #         visualization_list = []
    #         for graph in data_list:
    #             pdb = PDBFile(lig)
    #             pdb.add(lig, 0, 0)
    #             pdb.add(
    #                 (
    #                     orig_complex_graph["ligand"].pos
    #                     + orig_complex_graph.original_center
    #                 )
    #                 .detach()
    #                 .cpu(),
    #                 1,
    #                 0,
    #             )
    #             pdb.add(
    #                 (graph["ligand"].pos + graph.original_center).detach().cpu(),
    #                 part=1,
    #                 order=1,
    #             )
    #             visualization_list.append(pdb)

    #         start_time = time.time()
    #         if confidence_model is not None and not (
    #             confidence_args.use_original_model_cache
    #             or confidence_args.transfer_weights
    #         ):
    #             confidence_data_list = [
    #                 copy.deepcopy(confidence_complex_dict[orig_complex_graph.name[0]])
    #                 for _ in range(N)
    #             ]
    #         else:
    #             confidence_data_list = None

    #         data_list, confidence = sampling(
    #             data_list=data_list,
    #             model=model,
    #             inference_steps=actual_steps,
    #             tr_schedule=tr_schedule,
    #             rot_schedule=rot_schedule,
    #             tor_schedule=tor_schedule,
    #             device=device,
    #             t_to_sigma=t_to_sigma,
    #             model_args=score_model_args,
    #             no_random=no_random,
    #             ode=ode,
    #             visualization_list=visualization_list,
    #             confidence_model=confidence_model,
    #             confidence_data_list=confidence_data_list,
    #             confidence_model_args=confidence_args,
    #             batch_size=1,
    #             no_final_step_noise=no_final_step_noise,
    #         )
    #         ligand_pos = np.asarray(
    #             [
    #                 complex_graph["ligand"].pos.cpu().numpy()
    #                 + orig_complex_graph.original_center.cpu().numpy()
    #                 for complex_graph in data_list
    #             ]
    #         )
    #         run_times.append(time.time() - start_time)

    #         if confidence is not None and isinstance(
    #             confidence_args.rmsd_classification_cutoff, list
    #         ):
    #             confidence = confidence[:, 0]
    #         if confidence is not None:
    #             confidence = confidence.cpu().numpy()
    #             re_order = np.argsort(confidence)[::-1]
    #             confidence = confidence[re_order]
    #             confidences_list.append(confidence)
    #             ligand_pos = ligand_pos[re_order]
    #         write_dir = (
    #             f'{out_dir}/index{idx}_{data_list[0]["name"][0].replace("/","-")}'
    #         )
    #         os.makedirs(write_dir, exist_ok=True)
    #         confidences = []
    #         for rank, pos in enumerate(ligand_pos):
    #             mol_pred = copy.deepcopy(lig)
    #             if score_model_args.remove_hs:
    #                 mol_pred = RemoveHs(mol_pred)
    #             if rank == 0:
    #                 write_mol_with_coords(
    #                     mol_pred, pos, os.path.join(write_dir, f"rank{rank+1}.sdf")
    #                 )
    #             confidences.append(confidence[rank])
    #             write_mol_with_coords(
    #                 mol_pred,
    #                 pos,
    #                 os.path.join(
    #                     write_dir, f"rank{rank+1}_confidence{confidence[rank]:.2f}.sdf"
    #                 ),
    #             )
    #         self_distances = np.linalg.norm(
    #             ligand_pos[:, :, None, :] - ligand_pos[:, None, :, :], axis=-1
    #         )
    #         self_distances = np.where(
    #             np.eye(self_distances.shape[2]), np.inf, self_distances
    #         )
    #         min_self_distances_list.append(np.min(self_distances, axis=(1, 2)))

    #         filenames = []
    #         if confidence is not None:
    #             for rank, batch_idx in enumerate(re_order):
    #                 visualization_list[batch_idx].write(
    #                     os.path.join(write_dir, f"rank{rank+1}_reverseprocess.pdb")
    #                 )
    #                 filenames.append(
    #                     os.path.join(write_dir, f"rank{rank+1}_reverseprocess.pdb")
    #                 )
    #         else:
    #             for rank, batch_idx in enumerate(ligand_pos):
    #                 visualization_list[batch_idx].write(
    #                     os.path.join(write_dir, f"rank{rank+1}_reverseprocess.pdb")
    #                 )
    #                 filenames.append(
    #                     os.path.join(write_dir, f"rank{rank+1}_reverseprocess.pdb")
    #                 )
    #         names_list.append(orig_complex_graph.name[0])
    #     except Exception as e:
    #         print("Failed on", orig_complex_graph["name"], e)
    #         failures += 1
    #         return None
    # # zip outputs
    # zippath = shutil.make_archive(
    #     os.path.join("results", os.path.basename(pdb_path)), "zip", write_dir
    # )
    # print("Zipped outputs to", zippath)
    # labels = [
    #     f"rank {i+1}, confidence {confidences[i]:.2f}" for i in range(len(filenames))
    # ]

    # torch.cuda.empty_cache()
    return (
        'hello_world_output'
        # pdb_path
        # molecule(pdb_path, filenames[0], ligand_file),
        # gr.Dropdown.update(choices=labels, value=labels[0]),
        # filenames,
        # pdb_path,
        # zippath,
    )





image = (
    modal.Image.debian_slim(python_version="3.10")
)


@stub.local_entrypoint()
def main():
    pdb_output = update.call() #"6w70", "")
    print("the pdb path is", pdb_output)
