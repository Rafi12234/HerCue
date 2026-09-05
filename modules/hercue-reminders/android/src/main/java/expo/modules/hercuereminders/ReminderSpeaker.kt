package expo.modules.hercuereminders

import android.content.Context
import android.media.AudioAttributes
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import java.util.Locale

/**
 * Speaks the reminder sentence via Android TextToSpeech.
 *
 * Engine start-up is asynchronous and can outlive a BroadcastReceiver, so the
 * receiver holds a wake lock while this runs. Whether anything is audible still
 * depends on volume, silent mode, DND and audio focus — speech is a bonus on
 * top of the notification, never the guarantee.
 */
object ReminderSpeaker {
    private const val TAG = "HerCueTts"
    private const val UTTERANCE_ID = "hercue-reminder"

    private var engine: TextToSpeech? = null

    fun speak(context: Context, sentence: String, onDone: () -> Unit) {
        if (sentence.isBlank()) {
            onDone()
            return
        }

        val appContext = context.applicationContext
        var finished = false
        val finishOnce = {
            if (!finished) {
                finished = true
                onDone()
            }
        }

        val tts = TextToSpeech(appContext) { status ->
            if (status != TextToSpeech.SUCCESS) {
                Log.w(TAG, "TextToSpeech unavailable (status $status)")
                finishOnce()
                return@TextToSpeech
            }

            val instance = engine
            if (instance == null) {
                finishOnce()
                return@TextToSpeech
            }

            val localeResult = instance.setLanguage(Locale.getDefault())
            if (localeResult == TextToSpeech.LANG_MISSING_DATA ||
                localeResult == TextToSpeech.LANG_NOT_SUPPORTED
            ) {
                instance.setLanguage(Locale.US)
            }

            instance.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )

            instance.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    Log.d(TAG, "Speech started")
                }

                override fun onDone(utteranceId: String?) {
                    shutdown()
                    finishOnce()
                }

                @Deprecated("Required by the base class")
                override fun onError(utteranceId: String?) {
                    Log.w(TAG, "Speech failed")
                    shutdown()
                    finishOnce()
                }
            })

            val params = Bundle().apply {
                putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, android.media.AudioManager.STREAM_ALARM)
            }
            instance.speak(sentence, TextToSpeech.QUEUE_FLUSH, params, UTTERANCE_ID)
        }

        engine = tts
    }

    fun stop() {
        runCatching { engine?.stop() }
        shutdown()
    }

    private fun shutdown() {
        runCatching { engine?.shutdown() }
        engine = null
    }
}
