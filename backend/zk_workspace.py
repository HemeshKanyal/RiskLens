import os
import shutil
import tempfile
from contextlib import contextmanager

ZK_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "zk")


@contextmanager
def circuit_workspace(circuit_name: str):
    """
    Yield a private, temporary copy of a Noir circuit directory.

    nargo/bb read Prover.toml and write target/ and proof/ relative to the
    working directory, so running them in the shared circuit folder lets
    concurrent requests overwrite each other's inputs and proofs. Each call
    gets its own copy (including any prebuilt target/ to skip recompiling),
    which is deleted afterwards.
    """
    source_dir = os.path.join(ZK_ROOT, circuit_name)
    if not os.path.exists(os.path.join(source_dir, "vk", "vk")):
        raise Exception(f"VK not found for {circuit_name}. Run `bb write_vk` first.")

    tmp_root = tempfile.mkdtemp(prefix=f"{circuit_name}_")
    work_dir = os.path.join(tmp_root, circuit_name)
    try:
        shutil.copytree(
            source_dir,
            work_dir,
            ignore=shutil.ignore_patterns("proof", "Prover.toml", "*.sol"),
        )
        os.makedirs(os.path.join(work_dir, "proof"), exist_ok=True)
        yield work_dir
    finally:
        shutil.rmtree(tmp_root, ignore_errors=True)
