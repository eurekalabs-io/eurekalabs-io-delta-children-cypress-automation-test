# Guía de Integración con Slack

Esta guía explica cómo configurar notificaciones de Slack para los resultados de los tests de Cypress.

## Resumen

La integración con Slack envía resultados formateados de los tests a un canal de Slack después de cada ejecución en GitHub Actions. La notificación incluye:
- Estado de los tests (Pasados/Fallidos)
- Total de tests ejecutados
- Cantidad de tests pasados/fallidos
- Duración de los tests
- Detalles de tests fallidos (si los hay)
- Enlaces a la ejecución de GitHub Actions y al commit

## Instrucciones de Configuración

### Paso 1: Crear un Webhook de Slack

1. Ve a [Slack API Apps](https://api.slack.com/apps)
2. Haz clic en **"Create New App"** → **"From scratch"**
3. Nombra tu app (ej: "Notificaciones Tests Cypress") y selecciona tu workspace
4. Haz clic en **"Create App"**

### Paso 2: Habilitar Incoming Webhooks

1. En la configuración de tu app, ve a **"Incoming Webhooks"**
2. Activa **"Activate Incoming Webhooks"** a **On**
3. Haz clic en **"Add New Webhook to Workspace"**
4. Selecciona el canal donde quieres recibir las notificaciones
5. Haz clic en **"Allow"**
6. Copia la **Webhook URL** (se ve así: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`)

### Paso 3: Agregar Webhook URL a GitHub Secrets

1. Ve a tu repositorio de GitHub
2. Navega a **Settings** → **Secrets and variables** → **Actions**
3. Haz clic en **"New repository secret"**
4. Nombre: `SLACK_WEBHOOK_URL`
5. Valor: Pega tu Webhook URL de Slack
6. Haz clic en **"Add secret"**

### Paso 4: Verificar la Integración

1. Haz push de un commit o dispara manualmente el workflow de GitHub Actions
2. Después de que los tests se completen, revisa tu canal de Slack para ver la notificación

## Formato de la Notificación

La notificación de Slack incluye:

- **Estado**: ✅ PASSED o ❌ FAILED
- **Total de Tests**: Número de tests ejecutados
- **Pasados**: Número de tests pasados
- **Fallidos**: Número de tests fallidos
- **Duración**: Tiempo total de ejecución de los tests
- **Rama**: Rama de Git donde se ejecutaron los tests
- **Commit**: Enlace al commit
- **Tests Fallidos**: Lista de tests fallidos (si los hay)
- **Enlace**: Enlace directo a la ejecución de GitHub Actions

## Personalización

### Modificar el Contenido de la Notificación

Edita `scripts/slack-notifier.js` para personalizar:
- Formato del mensaje
- Colores
- Campos mostrados
- Número de tests fallidos mostrados

### Cambiar el Canal de Notificación

1. Vuelve a la configuración de tu app de Slack
2. Navega a **"Incoming Webhooks"**
3. Haz clic en **"Add New Webhook to Workspace"**
4. Selecciona un canal diferente
5. Actualiza el secreto `SLACK_WEBHOOK_URL` en GitHub con la nueva webhook URL

### Notificaciones Condicionales

La notificación se envía con `if: always()` en el workflow, lo que significa que se enviará independientemente de los resultados de los tests. Para enviar solo en fallos, cambia:

```yaml
- name: Send Slack notification
  if: failure()  # Solo enviar en fallo
```

Para enviar solo en éxito:

```yaml
- name: Send Slack notification
  if: success()  # Solo enviar en éxito
```

## Solución de Problemas

### No se reciben notificaciones

1. **Verifica GitHub Secrets**: Asegúrate de que `SLACK_WEBHOOK_URL` esté configurado correctamente
2. **Revisa los logs de GitHub Actions**: Busca errores en el paso "Send Slack notification"
3. **Verifica la webhook URL**: Prueba la webhook URL manualmente usando curl:
   ```bash
   curl -X POST -H 'Content-type: application/json' \
   --data '{"text":"Test message"}' \
   TU_WEBHOOK_URL
   ```

### Resultados de tests incorrectos

El script intenta parsear los resultados de Cypress desde:
1. `Cypress/results/mochawesome.json` (si usas el reporter mochawesome)
2. `cypress/results/*.json` (resultados por defecto de Cypress)

Si estás usando un reporter diferente, puede que necesites modificar `parseCypressResults()` en `scripts/slack-notifier.js`.

### No se encuentran resultados de tests

Si el script no puede encontrar resultados de tests, aún enviará una notificación pero con valores por defecto (0 tests). Asegúrate de:
- Cypress está configurado para generar reportes JSON
- El directorio de resultados existe y contiene archivos JSON

## Opcional: Instalar Mochawesome Reporter

Para un mejor parseo de resultados de tests, puedes instalar el reporter mochawesome:

```bash
npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator
```

Luego actualiza `cypress.config.js`:

```javascript
module.exports = defineConfig({
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'Cypress/results',
    overwrite: false,
    html: false,
    json: true
  },
  // ... resto de la configuración
});
```

## Notas de Seguridad

- Nunca commitees la webhook URL a tu repositorio
- Siempre usa GitHub Secrets para información sensible
- Considera rotar las webhook URLs periódicamente
- Limita el acceso al canal de Slack que recibe las notificaciones

## Soporte

Para problemas o preguntas:
1. Revisa los logs de GitHub Actions
2. Revisa la salida del script en el workflow
3. Verifica los permisos de la app de Slack
4. Asegúrate de que la webhook URL sea válida y esté activa

