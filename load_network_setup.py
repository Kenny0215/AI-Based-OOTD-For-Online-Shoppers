from utils import load_checkpoint
from networks import SegGenerator, GMM, ALIASGenerator
from utils import get_opt
import argparse
import os

# 
# 
# Virtual try on model loading code 
opt = get_opt()
print(opt)

seg = SegGenerator(opt, input_nc=opt.semantic_nc +
                   8, output_nc=opt.semantic_nc)
gmm = GMM(opt, inputA_nc=7, inputB_nc=3)
opt.semantic_nc = 7
alias = ALIASGenerator(opt, input_nc=9)
opt.semantic_nc = 13

checkpoint_path = os.path.join(opt.checkpoint_dir, opt.seg_checkpoint)
print("Loading checkpoint from:", checkpoint_path)
load_checkpoint(seg, checkpoint_path)

load_checkpoint(seg, os.path.join(opt.checkpoint_dir, opt.seg_checkpoint))
load_checkpoint(gmm, os.path.join(opt.checkpoint_dir, opt.gmm_checkpoint))
load_checkpoint(alias, os.path.join(opt.checkpoint_dir, opt.alias_checkpoint))

seg.eval()
gmm.eval()
alias.eval()
# 
# 
#