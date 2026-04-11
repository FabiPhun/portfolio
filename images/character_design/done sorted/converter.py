import os
import re
from collections import defaultdict
from PIL import Image

# Dictionary für Gruppen von Bildern mit gleichem Basisnamen
bild_gruppen = defaultdict(list)

print("Sammle Bilder...")

# Erster Durchlauf: Bilder gruppieren
for datei in os.listdir('.'):
    if datei.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp')):
        # Prüfen ob das Bild ein -p- Zahl Muster hat
        match = re.search(r'-p-(\d+)', datei)
        
        if match:
            # Basisname ohne das -p-XXXXX und Endung
            basis = re.sub(r'-p-\d+', '', datei)
            basis = basis.rsplit('.', 1)[0]  # Endung entfernen
            zahl = int(match.group(1))
            bild_gruppen[basis].append((zahl, datei))
            print(f"Gruppe gefunden: {basis} (Zahl: {zahl}) - {datei}")
        else:
            # Bilder ohne -p- werden später normal verarbeitet
            bild_gruppen["OHNE_P"].append((0, datei))

# Zweiter Durchlauf: Bei Gruppen nur das mit der höchsten Zahl behalten
for basis, bilder in bild_gruppen.items():
    if basis == "OHNE_P":
        # Bilder ohne -p- normal verarbeiten
        for _, datei in bilder:
            try:
                bild = Image.open(datei)
                
                # Neuen Namen erstellen (alles nach dem ersten Unterstrich)
                if '_' in datei:
                    neuer_name = datei.split('_', 1)[1]
                    neuer_name = neuer_name.rsplit('.', 1)[0] + '.png'
                else:
                    neuer_name = datei.rsplit('.', 1)[0] + '.png'
                
                # Bei doppelten Namen einfach überschreiben
                bild.save(neuer_name, 'PNG')
                os.remove(datei)
                print(f"✓ {datei} -> {neuer_name}")
            except Exception as e:
                print(f"✗ Fehler bei {datei}: {e}")
    
    else:
        # Gruppe mit -p- Bildern
        if len(bilder) > 1:
            # Sortieren nach Zahl (höchste zuerst)
            bilder.sort(reverse=True)
            
            # Das erste Bild (höchste Zahl) behalten
            hoechste_zahl, beste_datei = bilder[0]
            
            try:
                bild = Image.open(beste_datei)
                
                # Neuen Namen erstellen (Basisname + alles nach erstem Unterstrich)
                if '_' in beste_datei:
                    # Extrahiere den Teil nach dem ersten Unterstrich
                    nach_unterstrich = beste_datei.split('_', 1)[1]
                    # Entferne -p-XXXX und Endung
                    nach_unterstrich_clean = re.sub(r'-p-\d+', '', nach_unterstrich)
                    nach_unterstrich_clean = nach_unterstrich_clean.rsplit('.', 1)[0]
                    neuer_name = nach_unterstrich_clean + '.png'
                else:
                    neuer_name = basis + '.png'
                
                # Speichern (überschreibt falls vorhanden)
                bild.save(neuer_name, 'PNG')
                os.remove(beste_datei)
                print(f"✓ BEHALTEN (höchste Zahl {hoechste_zahl}): {beste_datei} -> {neuer_name}")
                
                # Alle anderen mit niedrigerer Zahl löschen
                for zahl, datei in bilder[1:]:
                    os.remove(datei)
                    print(f"✗ GELÖSCHT: {datei} (niedrigere Zahl {zahl})")
                    
            except Exception as e:
                print(f"✗ Fehler bei Gruppe {basis}: {e}")
        
        elif len(bilder) == 1:
            # Nur ein Bild in der Gruppe - normal verarbeiten
            zahl, datei = bilder[0]
            try:
                bild = Image.open(datei)
                
                # Neuen Namen erstellen
                if '_' in datei:
                    nach_unterstrich = datei.split('_', 1)[1]
                    nach_unterstrich_clean = re.sub(r'-p-\d+', '', nach_unterstrich)
                    nach_unterstrich_clean = nach_unterstrich_clean.rsplit('.', 1)[0]
                    neuer_name = nach_unterstrich_clean + '.png'
                else:
                    neuer_name = basis + '.png'
                
                # Speichern (überschreibt falls vorhanden)
                bild.save(neuer_name, 'PNG')
                os.remove(datei)
                print(f"✓ {datei} -> {neuer_name}")
            except Exception as e:
                print(f"✗ Fehler bei {datei}: {e}")

print("\n" + "="*50)
print("FERTIG! Alle Bilder verarbeitet.")
print("="*50)
