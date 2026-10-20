"""Resize the approved generated artwork into web and Android launcher assets."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent
public = root / 'packages/client/public/brand'
art = Image.open(root / 'assets/branding/fart-crew-icon.png').convert('RGBA')
res = root / 'packages/client/android/app/src/main/res'
for size in (32, 192, 512):
    art.resize((size, size), Image.Resampling.LANCZOS).save(public / f'icon-{size}.png')
for density, size, foreground_size in [('mdpi',48,108),('hdpi',72,162),('xhdpi',96,216),('xxhdpi',144,324),('xxxhdpi',192,432)]:
    folder = res / f'mipmap-{density}'
    art.resize((size,size),Image.Resampling.LANCZOS).save(folder / 'ic_launcher.png')
    legacy = Image.new('RGBA',(size,size),'#00777f')
    inset = round(size*.78)
    legacy.alpha_composite(art.resize((inset,inset),Image.Resampling.LANCZOS),((size-inset)//2,(size-inset)//2))
    mask=Image.new('L',(size,size),0)
    ImageDraw.Draw(mask).ellipse((0,0,size-1,size-1),fill=255)
    legacy.putalpha(mask)
    legacy.save(folder/'ic_launcher_round.png')
    foreground=Image.new('RGBA',(foreground_size,foreground_size),(0,0,0,0))
    safe=round(foreground_size*.62)
    foreground.alpha_composite(art.resize((safe,safe),Image.Resampling.LANCZOS),((foreground_size-safe)//2,(foreground_size-safe)//2))
    foreground.save(folder/'ic_launcher_foreground.png')
print('Generated web icons and Android launcher icons for all five densities.')
