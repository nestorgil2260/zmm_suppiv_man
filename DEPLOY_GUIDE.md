# 🚀 DEPLOY GUIDE - ZMM_SUPPIV_MAN (S/4HANA 2025)

## Información del Proyecto
- **Nombre:** Supplier Invoice Management - S/4HANA 2025 Extension (ZMM_SUPPIV_MAN)
- **ID de App:** `ui.s2p.mm.supplinvoice.manage.s1.ZMM_SUPPIV_MANS1Extension`
- **Versión:** 1.0.0
- **Tipo:** Extensión Fiori UI5
- **Fecha de Compilación:** 2026-03-25

---

## ✅ Cambios Realizados

### Correcciones de Compatibilidad S/4HANA 2025

Se han removido las referencias a mixins que no existen en S/4HANA 2025:

1. **AppCustom.controller.js**
   - Removidas 3 dependencias de mixins obsoletos
   - Archivos actualizados: `-dbg` y minificado

2. **S1Custom.controller.js**
   - Removidas 9 dependencias de mixins obsoletos
   - Archivos actualizados: `-dbg` y minificado
   - Funcionalidad activa preservada (métodos personalizados de manejo de campos XREF)

---

## 📦 Archivos Compilados

Los archivos están listos en la carpeta **`dist/`**:

```
dist/
├── Component.js
├── Component-dbg.js
├── Component-preload.js
├── manifest.json
├── index.html
├── neo-app.json
├── serviceBinding.js
├── controller/
│   ├── AppCustom.controller.js (ACTUALIZADO)
│   ├── AppCustom-dbg.controller.js (ACTUALIZADO)
│   ├── HeaderMoreCustom.controller.js
│   ├── S1Custom.controller.js (ACTUALIZADO)
│   ├── S1Custom-dbg.controller.js (ACTUALIZADO)
│   └── ...
├── view/
│   ├── S1Custom.view.xml
│   ├── blocks/
│   │   └── S1/
│   │       └── HeaderMoreCustom.view.xml
│   └── ...
├── fragment/
│   ├── popUp.fragment.xml
│   ├── popUpComp.fragment.xml
│   ├── popUpPost.fragment.xml
│   ├── popUpSim.fragment.xml
│   ├── popUpWorkflow.fragment.xml
│   └── popUpXref2VH.fragment.xml
├── i18n/
│   └── (todos los archivos de traducción)
└── localService/
    └── (metadatos OData locales)
```

---

## 🔧 Procedimiento de Despliegue en SAP S/4HANA

### Opción 1: Mediante SAP Web IDE / SAP Business Application Studio (RECOMENDADO)

1. **Descargar la carpeta `dist/`**
   ```bash
   # Comprimir la carpeta dist
   zip -r zmm_suppiv_man_dist.zip dist/
   ```

2. **Abrir SAP BAS/Web IDE**
   - URL: `https://<tu-servidor-s4hana>:44300/bas`
   - Iniciar sesión con usuario SAP

3. **Crear un nuevo proyecto**
   - File → New → Project from Template
   - Seleccionar "Fiori Application"
   - O importar la carpeta `dist/` si el proyecto existe

4. **Subir archivos compilados**
   - Deletear contenido anterior
   - Copiar contenido de `dist/` al proyecto
   - Asegurarse de que se copien:
     - `manifest.json`
     - `Component.js`
     - Carpetas: `controller/`, `view/`, `fragment/`, `i18n/`

5. **Desplegar a servidor ABAP**
   - Click derecho en el proyecto → Deploy
   - Seleccionar opción "Deploy to ABAP Repository"
   - Ingresar:
     - **ABAP Package:** `ZMMSIEXT` (o el package correspondiente)
     - **ABAP Application Name:** `ZMM_SUPPIV_MAN`
     - **Descripción:** Supplier Invoice Management Extension for S/4HANA 2025

6. **Activar el despliegue**
   - El sistema desplegará automáticamente
   - La aplicación estará disponible en launchpad

---

### Opción 2: Mediante Transacción /UI5/MAINT (SAPUI5 Repository)

1. **Acceder a SAP GUI a través de la transacción**
   ```
   Transacción: /UI5/MAINT
   ```

2. **Crear new SAPUI5 Application**
   - Application ID: `zmm_suppiv_man`
   - Description: Supplier Invoice Management Extension
   - UI5 Version: Detectar automáticamente

3. **Subir archivos**
   - Upload cada archivo desde `dist/`:
     - Empezar con `manifest.json`
     - Luego `Component.js`
     - Después archivos de `controller/`
     - Luego archivos de `view/`
     - Y demás carpetas

4. **Activar la aplicación**
   - Marcar como "Active"
   - Guardar cambios

---

### Opción 3: Mediante Transacción NWBC (NetWeaver Business Client)

1. **Conectar a SAP S/4HANA**
   - Abrir NWBC
   - Conectar con credenciales SAP

2. **Navegar a**
   ```
   SAP → Cross-Application Tools → Application Lifecycle Management → Maintain Applications
   ```

3. **Crear/Actualizar aplicación**
   - Application ID: `zmm_suppiv_man`
   - Upload archivos desde `dist/`

---

## ⚙️ Validación Post-Despliegue

### 1. Verificar Despliegue Exitoso

```
Transacción: /UI5/APPS_LOG
```
- Buscar aplicación `zmm_suppiv_man`
- Verificar status: **ACTIVE**

### 2. Probar en Launchpad

1. Abrir **SAP Fiori Launchpad**
2. Buscar tile: **"Crear Factura de Proveedor"** o semejante
3. Hacer click para abrir la aplicación
4. Verificar que **NO hay errores 404** en consola del navegador

### 3. Verificar Consola de Navegador (F12)

```javascript
// No debe haber errores como:
// "Failed to load ... RoutingMixin.js: 404"
// "Failed to resolve dependencies..."

// Si todo está correcto, deberías ver:
// "Application initialized successfully"
```

### 4. Prueba Funcional

- [ ] Acceder a la aplicación
- [ ] Crear una nueva factura de proveedor
- [ ] Verificar que los campos XREF1 y XREF2 funcionan correctamente
- [ ] Completar flujo de negocio (Simulate, Check, Post)
- [ ] Verificar mensajes personalizados

---

## 🔄 Revertir Cambios (Si es necesario)

Si necesitas volver a la versión anterior:

```
Transacción: /UI5/APPS_LOG
- Encontrar versión anterior de zmm_suppiv_man
- Click "Rollback"
```

---

## 📋 Requisitos Previos

- ✅ Acceso a SAP S/4HANA 2025 con rol de desarrollador
- ✅ Transacciones habilitadas: `/UI5/MAINT`, `/UI5/APPS_LOG`, `NWBC`
- ✅ Package ZMMSIEXT creado y asignado a usuario
- ✅ Backend OData `ZMM_POPUP_4170V2_SRV` disponible

---

## ❌ Problemas Comunes

### Problema: "Application could not be loaded"
**Solución:** Verificar que `manifest.json` y `Component.js` tienen rutas correctas

### Problema: Errores 404 en consola
**Solución:** Confirmar que TODOS los archivos fueron desplegados, especialmente:
- `controller/AppCustom.controller.js`
- `controller/S1Custom.controller.js`

### Problema: "Module not found"
**Solución:** Verificar que la carpeta `localService/` tiene metadata.xml

### Problema: Campos personalizados no funcionan
**Solución:** Verificar que se desplegaron:
- `controller/HeaderMoreCustom.controller.js`
- `view/blocks/S1/HeaderMoreCustom.view.xml`
- Fragmentos en `fragment/`

---

## 📞 Soporte

Si tienes problemas durante el despliegue:

1. **Revisar logs de SAP**
   ```
   Transacción: SM37 (Job Overview)
   o Transacción: AL10 (System Log)
   ```

2. **Activar debug mode**
   - Abrir F12 en navegador
   - Tab "Console" para mensajes
   - Tab "Network" para verificar cargas

3. **Contactar equipo SAP**
   - Proporcionar screenshot de error
   - Incluir logs de: `/UI5/APPS_LOG`

---

## ✨ Próximos Pasos

1. Descargar la carpeta `dist/`
2. Comprimir en ZIP
3. Acceder a SAP BAS/Web IDE
4. Desplegar según Opción 1, 2 o 3 anterior
5. Ejecutar validación post-despliegue
6. Comunicar al usuario final que la aplicación está lista

---

**Fecha de Generación:** 2026-03-25  
**Versión de Documento:** 1.0  
**Estado:** ✅ Listo para Despliegue

