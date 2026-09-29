import { Component } from '@angular/core';
import { HighlightModule } from 'ngx-highlightjs';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [HighlightModule],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss'
})
export class ProjectDetailComponent {
  codeSnippet = `// Configuración I2S para DAC (Ejemplo: PCM5102A con ESP32)
#include "driver/i2s.h"

void setup_i2s() {
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = 48000, // Frecuencia de muestreo (Hi-Res básica)
        .bits_per_sample = I2S_BITS_PER_SAMPLE_24BIT,
        .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 64
    };
    
    // Asignación de pines de hardware
    i2s_pin_config_t pin_config = {
        .bck_io_num = 26,   // Bit Clock (BCLK)
        .ws_io_num = 25,    // Word Select (LRCLK)
        .data_out_num = 22, // Data Out (DIN)
        .data_in_num = I2S_PIN_NO_CHANGE
    };
    
    // Inicializar el driver I2S
    i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_NUM_0, &pin_config);
    
    printf("[OK] Interfaz I2S inicializada. DAC listo para recibir stream.\\n");
}`;

  copyCode() {
    navigator.clipboard.writeText(this.codeSnippet);
    alert('Código C++ copiado al portapapeles');
  }
}