package expo.modules.hercuereminders

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.PowerManager
import android.util.Log

/**
 * Alarm trigger entry point.
 *
 * Runs with no JavaScript runtime, so everything the reminder needs is read
 * from the stored payload. A wake lock is held across the TTS callback because
 * `onReceive` would otherwise return before the sentence finishes.
 */
class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val occurrenceId = intent.getStringExtra(AlarmScheduler.EXTRA_OCCURRENCE_ID) ?: return
        val payload = ReminderStore.getScheduled(context, occurrenceId)

        if (payload == null) {
            Log.w(TAG, "Alarm fired for unknown occurrence $occurrenceId")
            return
        }

        Log.i(TAG, "Alarm fired: ${payload.type} ($occurrenceId)")

        // The notification is the guaranteed part and goes first, so a failure in
        // vibration or speech can never cost the user the reminder itself.
        runCatching { ReminderNotifier.show(context, payload) }
            .onFailure { Log.e(TAG, "Notification failed", it) }

        // Recorded here rather than at action time so the in-app inbox still
        // shows reminders the user never responded to.
        ReminderStore.enqueueAction(
            context,
            occurrenceId,
            payload.type,
            ACTION_DELIVERED,
            System.currentTimeMillis(),
            null,
            null
        )

        if (payload.vibrate) {
            runCatching { ReminderVibrator.play(context) }
                .onFailure { Log.e(TAG, "Vibration failed", it) }
        }

        // The payload deliberately survives the trigger: Snooze, Taken and the
        // food/bathroom follow-ups all need it, and they can be pressed minutes
        // later with no JS runtime alive. ActionReceiver clears it on a terminal
        // action, and stale entries are pruned by age.
        ReminderStore.pruneScheduled(context)

        if (payload.speak && payload.speech.isNotBlank()) {
            speakWithWakeLock(context, payload)
        }
    }

    private fun speakWithWakeLock(context: Context, payload: ReminderPayload) {
        val power = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
        val wakeLock = power?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, WAKE_LOCK_TAG)?.apply {
            setReferenceCounted(false)
            acquire(WAKE_LOCK_TIMEOUT_MS)
        }

        val pendingResult = goAsync()
        val release = {
            runCatching { if (wakeLock?.isHeld == true) wakeLock.release() }
            runCatching { pendingResult.finish() }
            Unit
        }

        runCatching {
            ReminderSpeaker.speak(context, payload.speech) { release() }
        }.onFailure {
            Log.e(TAG, "Speech failed", it)
            release()
        }
    }

    companion object {
        const val ACTION_DELIVERED = "DELIVERED"

        private const val TAG = "HerCueAlarm"
        private const val WAKE_LOCK_TAG = "hercue:reminder-speech"
        private const val WAKE_LOCK_TIMEOUT_MS = 20_000L
    }
}
