package expo.modules.hercuereminders

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat

/**
 * Builds and posts reminder notifications.
 *
 * Channels are created here rather than only from JavaScript, because after a
 * reboot an alarm can fire before the app has ever been opened.
 */
object ReminderNotifier {
    const val CHANNEL_REMINDERS = "hercue-reminders"
    const val CHANNEL_MEDICINE = "hercue-medicine"
    const val CHANNEL_GENERAL = "hercue-general"

    fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Vibration is disabled on the channel because the module plays its own
        // deliberate waveform; leaving both on produces a muddled double buzz.
        val reminders = NotificationChannel(
            CHANNEL_REMINDERS,
            "Reminders",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Water, food and bathroom reminders."
            enableVibration(false)
            lockscreenVisibility = NotificationCompat.VISIBILITY_PRIVATE
        }

        val medicine = NotificationChannel(
            CHANNEL_MEDICINE,
            "Medicine reminders",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Reminders for medicines you have added."
            enableVibration(false)
            lockscreenVisibility = NotificationCompat.VISIBILITY_PRIVATE
        }

        val general = NotificationChannel(
            CHANNEL_GENERAL,
            "General updates",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "Quiet, non-urgent messages from HerCue."
            lockscreenVisibility = NotificationCompat.VISIBILITY_PRIVATE
        }

        manager.createNotificationChannel(reminders)
        manager.createNotificationChannel(medicine)
        manager.createNotificationChannel(general)
    }

    private fun contentIntent(context: Context, payload: ReminderPayload): PendingIntent? {
        val launch = context.packageManager
            .getLaunchIntentForPackage(context.packageName)
            ?.apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                // Consumed by the JS deep-link handler to open the right screen.
                data = Uri.parse("hercue://reminder/${payload.type.lowercase()}/${payload.occurrenceId}")
            } ?: return null

        return PendingIntent.getActivity(
            context,
            payload.occurrenceId.hashCode(),
            launch,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun actionIntent(
        context: Context,
        payload: ReminderPayload,
        actionId: String
    ): PendingIntent {
        val intent = Intent(context, ActionReceiver::class.java).apply {
            action = ActionReceiver.ACTION_RESPOND
            putExtra(AlarmScheduler.EXTRA_OCCURRENCE_ID, payload.occurrenceId)
            putExtra(ActionReceiver.EXTRA_ACTION_ID, actionId)
            data = Uri.parse("hercue://action/${payload.occurrenceId}/$actionId")
        }

        return PendingIntent.getBroadcast(
            context,
            (payload.occurrenceId + actionId).hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    fun notificationId(occurrenceId: String): Int = occurrenceId.hashCode()

    fun show(context: Context, payload: ReminderPayload) {
        ensureChannels(context)

        val icon = context.applicationInfo.icon
        val builder = NotificationCompat.Builder(context, payload.channelId)
            .setSmallIcon(if (icon != 0) icon else android.R.drawable.ic_popup_reminder)
            .setContentTitle(payload.title)
            .setContentText(payload.body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(payload.body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .setWhen(payload.scheduledAt)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)

        contentIntent(context, payload)?.let { builder.setContentIntent(it) }

        payload.actions.forEach { action ->
            builder.addAction(0, action.label, actionIntent(context, payload, action.id))
        }

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(notificationId(payload.occurrenceId), builder.build())
    }

    fun dismiss(context: Context, occurrenceId: String) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancel(notificationId(occurrenceId))
    }

    fun dismissAll(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancelAll()
    }
}
