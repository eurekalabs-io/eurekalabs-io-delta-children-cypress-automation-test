# Guía de Reportes de Tests

Esta guía explica cómo acceder y visualizar los reportes de ejecución de tests.

## Resumen

Después de cada ejecución de tests, se generan automáticamente reportes HTML completos que están disponibles como artifacts de GitHub Actions. Estos reportes proporcionan un resumen visual y fácil de leer de todas las ejecuciones de tests sin necesidad de acceder a los logs del workflow.

## Acceder a los Reportes

### Método 1: Artifacts de GitHub Actions (Recomendado)

1. Ve a tu repositorio en GitHub
2. Navega a la pestaña **Actions**
3. Haz clic en la ejecución del workflow que quieres ver
4. Desplázate hacia abajo hasta la sección **Artifacts** al final de la página
5. Descarga el artifact **test-report-html**
6. Extrae el archivo ZIP
7. Abre `test-report.html` en tu navegador web

### Método 2: Resumen de GitHub Actions

1. Ve a tu repositorio en GitHub
2. Navega a la pestaña **Actions**
3. Haz clic en la ejecución del workflow
4. Desplázate hacia arriba en la página de ejecución
5. Visualiza la sección **Summary** que muestra:
   - Estado de ejecución de tests
   - Total de tests, pasados, fallidos
   - Porcentaje de éxito
   - Duración de los tests
   - Resultados detallados de tests

### Método 3: Ejecución Local

Si ejecutas tests localmente, los reportes se generan en:
```
Cypress/reports/merged/test-report.html
```

Simplemente abre este archivo en tu navegador web.

## Contenido del Reporte

El reporte HTML incluye:

- **Resumen Ejecutivo**
  - Total de tests ejecutados
  - Conteos de Pass/Fail/Pending
  - Tasa de éxito general
  - Tiempo total de ejecución

- **Suites de Tests**
  - Resultados de suites de tests individuales
  - Detalles de casos de test
  - Tiempo de ejecución por test
  - Mensajes de error para tests fallidos

- **Gráficos y Visualizaciones**
  - Gráficos de distribución Pass/Fail
  - Gráficos de duración de tests
  - Gráficos de comparación de suites

- **Información Detallada de Tests**
  - Descripciones de tests
  - Stack traces de errores (para fallos)
  - Screenshots (si están disponibles)
  - Timestamps de ejecución

## Características del Reporte

### Elementos Interactivos

- **Secciones Expandibles**: Haz clic en las suites de tests para expandir/colapsar detalles
- **Filtrado**: Filtra tests por estado (Pass/Fail/Pending)
- **Búsqueda**: Busca nombres de tests específicos o mensajes de error
- **Ordenamiento**: Ordena tests por nombre, duración o estado

### Indicadores Visuales

- ✅ Marca de verificación verde para tests pasados
- ❌ X roja para tests fallidos
- ⏸️ Icono de pausa amarillo para tests pendientes/omitidos

## Retención de Reportes

- **GitHub Actions**: Los reportes se retienen por 30 días
- **Reportes Locales**: Almacenados en el directorio `Cypress/reports/` (no se commitean a git)

## Solución de Problemas

### Reporte No Generado

Si el reporte no está disponible:

1. Verifica que los tests se completaron exitosamente
2. Verifica que el reporter `mochawesome` está instalado:
   ```bash
   npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator
   ```
3. Revisa los logs de GitHub Actions para errores en el paso "Generate HTML test report"

### Reporte Está Vacío

Si el reporte no muestra tests:

1. Verifica que los tests se ejecutaron realmente
2. Verifica que los archivos de test coinciden con el patrón en `cypress.config.js`
3. Revisa los logs de ejecución de tests para errores

### No Se Puede Descargar el Artifact

Si no puedes descargar el artifact:

1. Asegúrate de tener acceso al repositorio
2. Verifica que la ejecución del workflow se completó (incluso si los tests fallaron)
3. Verifica que el artifact se subió (revisa los logs del workflow)

## Mejores Prácticas

1. **Revisar Reportes Regularmente**: Revisa los reportes después de cada ejecución de tests para detectar problemas temprano
2. **Compartir Reportes**: Descarga y comparte reportes HTML con miembros del equipo para discusión
3. **Archivar Reportes Importantes**: Descarga y guarda reportes para releases o hitos importantes
4. **Comparar Reportes**: Compara reportes entre diferentes ejecuciones para identificar tendencias

## Integración con Slack

Los resúmenes de ejecución de tests se envían automáticamente a Slack (si está configurado). La notificación de Slack incluye:
- Resumen rápido del estado
- Enlace para descargar el reporte HTML completo
- Enlace a la ejecución de GitHub Actions

Consulta la [Guía de Integración con Slack](./SLACK_INTEGRATION_ES.md) para instrucciones de configuración.

## Configuración del Reporte

La generación de reportes está configurada en `cypress.config.js`:

```javascript
reporter: 'mochawesome',
reporterOptions: {
  reportDir: 'Cypress/reports',
  overwrite: false,
  html: true,
  json: true,
  timestamp: 'mmddyyyy_HHMMss',
  reportFilename: '[name]-report',
  charts: true,
  code: false,
  inline: true
}
```

Para personalizar los reportes, modifica estas opciones en `cypress.config.js`.

## Soporte

Para problemas o preguntas:
1. Revisa los logs del workflow de GitHub Actions
2. Revisa el script de generación de reportes: `scripts/generate-report.js`
3. Verifica que todas las dependencias estén instaladas correctamente

