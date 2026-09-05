package expo.modules.hercuereminders

import android.content.Context
import android.media.AudioAttributes
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/**
 * The deliberate reminder waveform — distinct from the light UI haptics in JS.
 *
 * Always finite. The phone must never be left buzzing.
 */
object ReminderVibrator {
    /** pulse · pause · pulse · longer pause · final pulse */
    private val PATTERN = longArrayOf(0, 320, 180, 320, 320, 480)
    private val AMPLITUDES = intArrayOf(0, 255, 0, 255, 0, 255)

    private fun vibrator(context: Context): Vibrator? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager =
                context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            manager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    fun isAvailable(context: Context): Boolean = vibrator(context)?.hasVibrator() == true

    fun play(context: Context) {
        val device = vibrator(context) ?: return
        if (!device.hasVibrator()) return

        val attributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()

        // Amplitude control is not universal; fall back to the plain waveform.
        val effect = if (device.hasAmplitudeControl()) {
            VibrationEffect.createWaveform(PATTERN, AMPLITUDES, -1)
        } else {
            VibrationEffect.createWaveform(PATTERN, -1)
        }

        runCatching { device.vibrate(effect, attributes) }
    }

    fun cancel(context: Context) {
        runCatching { vibrator(context)?.cancel() }
    }
}
