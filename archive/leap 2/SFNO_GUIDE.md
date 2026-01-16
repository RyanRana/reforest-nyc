# Spherical FNO Guide for Climate Emulation

## Overview

This guide explains how to use Spherical Fourier Neural Operators (SFNO) with `torch-harmonics` in the NYC LEAP project.

## What is SFNO?

Spherical Fourier Neural Operators learn mappings between function spaces on the sphere using:
- **Spherical Harmonic Transforms (SHT)**: Transform data between physical and spectral domains
- **Spectral Convolutions**: Learn filters in the frequency domain
- **Multi-scale Learning**: Capture both large-scale and small-scale patterns

## Installation

```bash
pip install torch-harmonics
```

**Requirements**:
- PyTorch (installed automatically)
- CUDA-capable GPU (recommended for performance)
- JAX (for integration with our workflow)

## When to Use SFNO

✅ **Good for**:
- Global atmospheric data (full Earth coverage)
- Data on regular lat/lon grids
- Problems requiring large-scale pattern recognition
- Multi-resolution modeling

❌ **Not ideal for**:
- Regional subsets (like NYC only)
- Vertical profile data without spatial structure
- Small datasets
- CPU-only environments

## Architecture Components

### 1. Spherical Harmonic Transform (SHT)

```python
import torch_harmonics as th

# Create SHT operator
nlat, nlon = 512, 1024
sht = th.RealSHT(nlat, nlon, grid="equiangular").cuda()

# Transform spatial data to spectral coefficients
# x: (batch, channels, nlat, nlon)
coeffs = sht(x)

# Transform back to physical space
isht = th.InverseRealSHT(nlat, nlon, grid="equiangular").cuda()
x_reconstructed = isht(coeffs)
```

### 2. Spectral Convolution Layer

The core of SFNO is learning in the spectral domain:

```python
# In spectral space
coeffs = SHT(x)
# Learn spectral filters
output_coeffs = SpectralConv(coeffs, learnable_weights)
# Transform back
output = InverseSHT(output_coeffs)
```

### 3. Skip Connections

Like FNO, SFNO uses skip connections to preserve information:

```python
# Fourier path
x_spectral = SFNO_layer(x)
# Skip path
x_skip = MLP(x)
# Combine
output = x_spectral + x_skip
```

## Integration with JAX

Our project uses JAX, but `torch-harmonics` is PyTorch-based. Bridge them using DLPack:

```python
from jax import dlpack as jax_dlpack
from torch.utils import dlpack as torch_dlpack

def jax_to_torch(x_jax):
    return torch_dlpack.from_dlpack(jax_dlpack.to_dlpack(x_jax))

def torch_to_jax(x_torch):
    return jax_dlpack.from_dlpack(torch_dlpack.to_dlpack(x_torch))
```

See `notebooks/05_advanced_emulators.ipynb` for full implementation.

## Data Preparation for SFNO

### Required Format

SFNO expects data in **(batch, lat, lon, channels)** format:

```python
# Example: Global atmospheric state
batch_size = 32
nlat = 128  # Latitude grid points
nlon = 256  # Longitude grid points (typically 2×nlat)
n_vars = 5  # Temperature, humidity, u, v, pressure

X = np.random.randn(batch_size, nlat, nlon, n_vars)
```

### ClimSim Data Adaptation

ClimSim low-res provides **columnar data** (vertical profiles), not spatial grids. To use SFNO:

1. **Option A**: Use full global dataset (not NYC subset)
2. **Option B**: Create synthetic spatial grid from point data
3. **Option C**: Use 1D CNN instead (recommended for NYC subset)

## Performance Considerations

### Grid Size

- **Small (32×64)**: Fast, good for prototyping
- **Medium (128×256)**: Balanced, typical for regional climate
- **Large (512×1024)**: High-resolution, requires significant GPU memory

### Spectral Modes

Trade-off between accuracy and speed:

```python
# Low modes (8-16): Capture only large-scale patterns
# Medium modes (32-64): Good balance
# High modes (128+): Capture fine details, slower
```

### Memory Requirements

SFNO is memory-intensive:
- 32×64 grid, 4 layers, 256 hidden: ~2GB GPU memory
- 128×256 grid, 4 layers, 256 hidden: ~8GB GPU memory
- 512×1024 grid, 4 layers, 512 hidden: ~32GB GPU memory

## Example Training Code

```python
import jax
import flax.linen as nn
from notebooks.advanced_emulators import SFNOClimateEmulator

# Initialize model
model = SFNOClimateEmulator(
    nlat=128,
    nlon=256,
    input_channels=5,
    output_channels=3,
    hidden_dim=256,
    num_layers=4,
    modes_lat=32,
    modes_lon=32
)

# Standard JAX/Flax training loop
# See notebooks/05_advanced_emulators.ipynb for full implementation
```

## References

1. **SFNO Paper**: [Spherical Fourier Neural Operators (ICML 2023)](https://arxiv.org/abs/2306.03838)
2. **FourCastNet**: [Weather forecasting with SFNO](https://arxiv.org/abs/2202.11214)
3. **torch-harmonics**: [GitHub Repository](https://github.com/NVIDIA/torch-harmonics)
4. **ClimateLearn**: [Benchmark suite](https://github.com/aditya-grover/climate-learn)

## Troubleshooting

### Issue: "torch-harmonics not found"
```bash
pip install torch-harmonics
# Then restart Jupyter kernel
```

### Issue: "CUDA out of memory"
- Reduce grid size (nlat, nlon)
- Reduce batch size
- Reduce number of spectral modes
- Use gradient checkpointing

### Issue: "AMP precision errors"
torch-harmonics requires power-of-2 dimensions for FP16. Use FP32:
```python
with torch.autocast(device_type="cuda", enabled=False):
    output = model(input)
```

## Best Practices

1. **Start small**: Test with 32×64 grid before scaling up
2. **Validate physics**: Check conservation laws (mass, energy)
3. **Monitor spectral norms**: Track energy in different frequency bands
4. **Use equiangular grid**: Better numerical properties than lat/lon
5. **Profile memory**: Use PyTorch profiler to identify bottlenecks

## NYC LEAP Recommendation

For the NYC subset:
- ✅ **Use 1D CNN** for vertical profile modeling
- ⏸️ **Reserve SFNO** for future global modeling work
- 🔄 **Hybrid approach**: 1D CNN for local + SFNO for teleconnections

---

For questions or issues, see the main project README or consult the torch-harmonics documentation.
