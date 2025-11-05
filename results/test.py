import torch

ckpt = torch.load('checkpoints/seg_final.pth')
print(type(ckpt))