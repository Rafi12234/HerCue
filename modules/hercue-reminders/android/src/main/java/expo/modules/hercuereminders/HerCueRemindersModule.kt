package expo.modules.hercuereminders

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class ActionRecord : Record {
    @Field var id: String = ""
    @Field var label: String = ""
}

class ReminderRecord : Record {
    @Field var occurrenceId: String = ""
    @Field var occurrenceKey: String = ""
    @Field var type: String = ""
    @Field var title: String = ""
    @Field var body: String = ""
    @Field var speech: String = ""
    /** Epoch milliseconds. Doubles cross the bridge safely; Long does not. */
    @Field var scheduledAt: Double = 0.0
    @Field var channelId: String = ReminderNotifier.CHANNEL_REMINDERS
    @Field var actions: List<ActionRecord> = emptyList()
    @Field var vibrate: Boolean = true
    @Field var speak: Boolean = true
    @Field var snoozeMinutes: Int = 15
    @Field var followUpMinutes: Int? = null
    @Field var deepLink: String = "/"

    fun toPayload() = ReminderPayload(
        occurrenceId = occurrenceId,
        occurrenceKey = occurrenceKey.ifBlank { occurrenceId },
        type = type,
        title = title,
        body = body,
        speech = speech,
        scheduledAt = scheduledAt.toLong(),
        channelId = channelId,
        actions = actions.map { ReminderAction(it.id, it.label) },
        vibrate = vibrate,
        speak = speak,
        snoozeMinutes = snoozeMinutes,
        followUpMinutes = followUpMinutes,
        deepLink = deepLink
    )
}

/**
 * JavaScript bridge for the reminder engine.
 *
 * JS owns the domain (which occurrences exist, what they mean); this module
 * owns delivery (alarms, notifications, vibration, speech) so the reminder path
 * never depends on a live JS runtime.
 */
class HerCueRemindersModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("HerCueReminders")

        OnCreate {
            ReminderNotifier.ensureChannels(context)
        }

        Function("isAvailable") { true }

        Function("canScheduleExact") {
            AlarmScheduler.canScheduleExact(context)
        }

        Function("openExactAlarmSettings") {
            AlarmScheduler.openExactAlarmSettings(context)
        }

        Function("hasVibrator") {
            ReminderVibrator.isAvailable(context)
        }

        Function("schedule") { reminder: ReminderRecord ->
            AlarmScheduler.schedule(context, reminder.toPayload())
        }

        Function("cancel") { occurrenceId: String ->
            AlarmScheduler.cancel(context, occurrenceId)
            ReminderNotifier.dismiss(context, occurrenceId)
        }

        Function("cancelAll") {
            AlarmScheduler.cancelAll(context)
            ReminderNotifier.dismissAll(context)
        }

        Function("scheduledIds") {
            ReminderStore.allScheduled(context).map { it.occurrenceId }
        }

        /** JSON array of actions taken while no JS runtime was alive. */
        Function("pendingActions") {
            ReminderStore.pendingActionsJson(context)
        }

        Function("clearPendingActions") {
            ReminderStore.clearPendingActions(context)
        }

        Function("dismissNotification") { occurrenceId: String ->
            ReminderNotifier.dismiss(context, occurrenceId)
        }

        Function("vibrate") {
            ReminderVibrator.play(context)
        }

        Function("stopVibration") {
            ReminderVibrator.cancel(context)
        }

        AsyncFunction("speak") { sentence: String ->
            ReminderSpeaker.speak(context, sentence) {}
        }

        Function("stopSpeaking") {
            ReminderSpeaker.stop()
        }

        /** Used by the Settings "Test reminder" action; goes through the real path. */
        Function("showNow") { reminder: ReminderRecord ->
            val payload = reminder.toPayload()
            ReminderStore.putScheduled(context, payload)
            ReminderNotifier.show(context, payload)
            if (payload.vibrate) ReminderVibrator.play(context)
            if (payload.speak && payload.speech.isNotBlank()) {
                ReminderSpeaker.speak(context, payload.speech) {}
            }
        }
    }

    private val context
        get() = requireNotNull(appContext.reactContext) { "React context is unavailable" }
}
