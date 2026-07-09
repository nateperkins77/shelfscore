$nodeDir = "$env:LOCALAPPDATA\node-portable\node-v22.17.0-win-x64"
$env:Path = "$nodeDir;$env:Path"
Set-Location "C:\Users\NathanPerkins\Documents\claude projects\book-tracker"
& "$nodeDir\npm.cmd" run preview -- --port 4173 --strictPort
