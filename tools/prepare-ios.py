"""Apply FART CREW metadata after `cap add ios`; no signing credentials required."""
import json
import plistlib
import re
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
app = root / 'packages/client/ios/App'
info_path = app / 'App/Info.plist'
with info_path.open('rb') as f:
    info = plistlib.load(f)
info['CFBundleDisplayName'] = 'FART CREW'
info['NSMicrophoneUsageDescription'] = 'Speak with your current crew when you enable crew voice. Your microphone stops when you leave voice or the app goes into the background.'
info['UIRequiresFullScreen'] = True
info['UISupportedInterfaceOrientations'] = ['UIInterfaceOrientationPortrait', 'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight']
with info_path.open('wb') as f:
    plistlib.dump(info, f, sort_keys=False)

project_path = app / 'App.xcodeproj/project.pbxproj'
project = project_path.read_text()
project = re.sub(r'MARKETING_VERSION = [^;]+;', 'MARKETING_VERSION = 1.9;', project)
project = re.sub(r'CURRENT_PROJECT_VERSION = [^;]+;', 'CURRENT_PROJECT_VERSION = 10;', project)
project_path.write_text(project)

icons = app / 'App/Assets.xcassets/AppIcon.appiconset'
icons.mkdir(parents=True, exist_ok=True)
image = Image.open(root / 'assets/branding/fart-crew-icon.png').convert('RGBA').resize((1024, 1024), Image.Resampling.LANCZOS)
opaque = Image.new('RGB', image.size, '#075e59')
opaque.paste(image, mask=image.getchannel('A'))
opaque.save(icons / 'fart-crew-1024.png')
(icons / 'Contents.json').write_text(json.dumps({'images': [{'filename': 'fart-crew-1024.png', 'idiom': 'universal', 'platform': 'ios', 'size': '1024x1024'}], 'info': {'author': 'xcode', 'version': 1}}, indent=2))
print('Prepared FART CREW 1.9 iOS branding, orientation and microphone permission.')
