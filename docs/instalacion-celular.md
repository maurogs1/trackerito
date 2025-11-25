# Instalación en el Celular - Guía Completa

Tienes varias opciones para instalar y probar la app en tu celular. Aquí están ordenadas de la más simple a la más completa:

---

## Opción 1: Expo Go (Más Rápida - Desarrollo)

### ✅ Pros
- Instalación inmediata
- No necesitas compilar nada
- Perfecto para desarrollo y pruebas rápidas

### ❌ Cons
- Requiere conexión a tu computadora
- Algunas features nativas no funcionan
- No es la app "real" compilada

### 📱 Pasos

1. **Descarga Expo Go en tu celular:**
   - [Android: Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS: App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **En tu computadora, asegúrate que el servidor esté corriendo:**
   ```bash
   npx expo start
   ```

3. **Escanea el código QR:**
   - Android: Abre Expo Go y escanea el QR del terminal
   - iOS: Abre la cámara y escanea el QR

4. **Listo!** La app debería abrirse en tu celular

> **Nota:** Tu celular debe estar en la misma red WiFi que tu computadora.

---

## Opción 2: Development Build (Recomendada para ti)

### ✅ Pros
- App nativa completa instalada en tu celular  
- Funciona sin conexión una vez instalada
- Todas las features nativas funcionan
- Puedes cargar datos reales offline

### ❌ Cons
- Proceso de compilación inicial (5-10 min)
- Requiere cuenta de Expo

### 📱 Pasos

#### Paso 1: Instalar EAS CLI
```bash
npm install -g eas-cli
```

#### Paso 2: Login en Expo
```bash
eas login
```
(Crea una cuenta gratuita en expo.dev si no tienes)

#### Paso 3: Configurar el proyecto
```bash
eas build:configure
```

#### Paso 4: Crear un build de desarrollo para Android
```bash
eas build --profile development --platform android
```

Este comando:
- Compilará tu app en los servidores de Expo
- Te dará un link para descargar el APK
- Tardará unos 5-10 minutos

#### Paso 5: Instalar en tu celular
1. Cuando termine, te dará un link de descarga
2. Abre ese link en tu celular Android
3. Descarga el APK
4. Instálalo (debes activar "Instalar apps desconocidas")

#### Paso 6: Ejecutar
Una vez instalada:
```bash
# En tu computadora
npx expo start --dev-client
```

Abre la app en tu celular y escanea el QR (igual que Expo Go, pero ahora es tu app nativa).

---

## Opción 3: Preview Build (App Independiente)

### ✅ Pros
- App completamente independiente
- No necesita conexión a tu computadora
- Como una app "de verdad"

### ❌ Cons
- Cada cambio requiere rebuild (más lento)
- Tarda más en compilar

### 📱 Pasos

#### Para Android (APK)
```bash
eas build --profile preview --platform android
```

Este comando te generará un APK que puedes instalar directamente sin necesidad de Google Play Store.

#### Para iOS (Requiere cuenta de desarrollador)
```bash
eas build --profile preview --platform ios
```

> **Nota iOS:** Para iOS necesitas enrollarte en el Apple Developer Program ($99/año) o usar TestFlight con una cuenta gratuita.

---

## Opción 4: Producción (App Store/Play Store)

### Solo si quieres publicar la app

```bash
# Para Android
eas build --profile production --platform android

# Para iOS  
eas build --profile production --platform ios
```

Luego sigues el proceso de publicación en cada store.

---

## 🎯 Mi Recomendación para tu caso

**Para empezar hoy mismo:**
1. Usa **Expo Go** (Opción 1) - 2 minutos
2. Carga algunos datos de prueba
3. Ve cómo se siente la app

**Para uso diario con datos reales:**
1. Crea un **Development Build** (Opción 2) - Una vez
2. Instálalo en tu celular
3. Desconecta modo demo y carga datos reales
4. La app persistirá los datos localmente + Supabase

---

## Configuración Necesaria en `app.json`

Para que los builds funcionen, asegúrate que tu `app.json` tenga:

```json
{
  "expo": {
    "name": "Trackerito",
    "slug": "trackerito",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "scheme": "trackerito",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#6366F1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#6366F1"
      },
      "package": "com.tuusuario.trackerito"
    },
    "ios": {
      "bundleIdentifier": "com.tuusuario.trackerito",
      "supportsTablet": true
    }
  }
}
```

Cambia `tuusuario` por tu nombre o apodo.

---

## Comandos Útiles

### Ver builds anteriores
```bash
eas build:list
```

### Ver detalles de un build
```bash
eas build:view [BUILD_ID]
```

### Cancelar un build en progreso
```bash
eas build:cancel [BUILD_ID]
```

---

## Troubleshooting

### "No network connection"
- Asegúrate que tu celular y PC estén en la misma WiFi
- Desactiva VPN si tienes

### "Unable to install APK"
- Activa "Instalar apps desconocidas" en Settings
- Settings → Security → Unknown sources

### Build falla
- Revisa que `app.json` esté bien configurado
- Verifica que no haya errores de TypeScript: `npx tsc --noEmit`

---

## Próximos Pasos

Una vez que tengas la app instalada:

1. **Desactiva modo demo** en Settings
2. **Login con Google** (tu cuenta de Supabase)
3. **Empieza a cargar datos reales**:
   - Gastos diarios
   - Metas de ahorro
   - Categorías personalizadas

La app guardará todo en Supabase y tendrás acceso desde cualquier dispositivo! 🚀
