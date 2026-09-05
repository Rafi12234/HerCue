package expo.modules.hercuereminders

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import java.util.UUID

/**
 * Handles notification action buttons.
 *
 * The app process is frequently dead here, so the decision is written to a
 * durable queue that JavaScript drains later. Snooze and dynamic follow-ups are
 * re-armed natively straight away, so the reminder chain continues even if the
 * app is never reopened.
 */
class ActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val occurrenceId = intent.getStringExtra(AlarmScheduler.EXTRA_OCCURRENCE_ID) ?: return
        val actionId = intent.getStringExtra(EXTRA_ACTION_ID) ?: return
        val payload = ReminderStore.getScheduled(context, occurrenceId)

        Log.i(TAG, "Action received: $actionId for $occurrenceId")

        ReminderNotifier.dismiss(context, occurrenceId)
        ReminderVibrator.cancel(context)
        ReminderSpeaker.stop()

        val now = System.currentTimeMillis()
        val type = payload?.type ?: intent.getStringExtra(EXTRA_TYPE) ?: "UNKNOWN"

        when (actionId) {
            ACTION_SNOOZE -> handleSnooze(context, occurrenceId, type, payload, now)
            else -> handleResolution(context, occurrenceId, type, actionId, payload, now)
        }
    }

    private fun handleSnooze(
        context: Context,
        occurrenceId: String,
        type: String,
        payload: ReminderPayload?,
        now: Long
    ) {
        if (payload == null) {
            ReminderStore.enqueueAction(context, occurrenceId, type, ACTION_SNOOZE, now, null, null)
            return
        }

        val snoozeId = UUID.randomUUID().toString()
        val snoozeAt = now + payload.snoozeMinutes * 60_000L

        val snoozePayload = payload.copy(
            occurrenceId = snoozeId,
            occurrenceKey = "$occurrenceId:snooze:$snoozeAt",
            scheduledAt = snoozeAt
        )

        AlarmScheduler.schedule(context, snoozePayload)
        ReminderStore.enqueueAction(context, occurrenceId, type, ACTION_SNOOZE, now, snoozeId, snoozeAt)
    }

    private fun handleResolution(
        context: Context,
        occurrenceId: String,
        type: String,
        actionId: String,
        payload: ReminderPayload?,
        now: Long
    ) {
        var followUpId: String? = null
        var followUpAt: Long? = null

        // Food and bathroom are anchored to the confirmation, so the next check is
        // armed here rather than waiting for the app to be opened.
        val followUpMinutes = payload?.followUpMinutes
        if (actionId == ACTION_COMPLETE && payload != null && followUpMinutes != null) {
            followUpId = UUID.randomUUID().toString()
            followUpAt = now + followUpMinutes * 60_000L

            AlarmScheduler.schedule(
                context,
                payload.copy(
                    occurrenceId = followUpId,
                    occurrenceKey = "${type.lowercase()}:followup:$followUpAt",
                    scheduledAt = followUpAt
                )
            )
        }

        ReminderStore.enqueueAction(context, occurrenceId, type, actionId, now, followUpId, followUpAt)

        // Terminal decision: nothing else can be pressed for this reminder.
        ReminderStore.removeScheduled(context, occurrenceId)
    }

    companion object {
        const val ACTION_RESPOND = "expo.modules.hercuereminders.RESPOND"
        const val EXTRA_ACTION_ID = "actionId"
        const val EXTRA_TYPE = "type"

        const val ACTION_COMPLETE = "COMPLETE"
        const val ACTION_SNOOZE = "SNOOZE"
        const val ACTION_SKIP = "SKIP"

        private const val TAG = "HerCueAlarm"
    }
}
