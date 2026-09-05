package expo.modules.hercuereminders

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.util.Log

/**
 * Wraps AlarmManager.
 *
 * Exact alarms are a privilege on Android 12+, so every schedule call degrades
 * deliberately instead of throwing: an inexact alarm that fires a few minutes
 * late is far better than no reminder at all.
 */
object AlarmScheduler {
    const val ACTION_FIRE = "expo.modules.hercuereminders.FIRE"
    const val EXTRA_OCCURRENCE_ID = "occurrenceId"

    private const val TAG = "HerCueAlarm"

    fun canScheduleExact(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
        val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        return manager.canScheduleExactAlarms()
    }

    fun openExactAlarmSettings(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return false
        return runCatching {
            val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                data = android.net.Uri.parse("package:${context.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            true
        }.getOrElse {
            Log.w(TAG, "Could not open exact alarm settings", it)
            false
        }
    }

    private fun firePendingIntent(context: Context, occurrenceId: String): PendingIntent {
        val intent = Intent(context, ReminderReceiver::class.java).apply {
            action = ACTION_FIRE
            putExtra(EXTRA_OCCURRENCE_ID, occurrenceId)
            // Request codes are ints and ids are UUIDs, so the id also rides in
            // the data URI to keep PendingIntents from colliding on hash.
            data = android.net.Uri.parse("hercue://reminder/$occurrenceId")
        }

        return PendingIntent.getBroadcast(
            context,
            occurrenceId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    /** Returns the mode actually used: "exact", "inexact" or "failed". */
    fun schedule(context: Context, payload: ReminderPayload): String {
        val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pendingIntent = firePendingIntent(context, payload.occurrenceId)
        ReminderStore.putScheduled(context, payload)

        return runCatching {
            if (canScheduleExact(context)) {
                manager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    payload.scheduledAt,
                    pendingIntent
                )
                "exact"
            } else {
                // Doze can still delay this, but it survives idle unlike a plain set().
                manager.setAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    payload.scheduledAt,
                    pendingIntent
                )
                "inexact"
            }
        }.getOrElse { error ->
            Log.e(TAG, "Failed to schedule ${payload.occurrenceId}", error)
            "failed"
        }
    }

    fun cancel(context: Context, occurrenceId: String) {
        val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        manager.cancel(firePendingIntent(context, occurrenceId))
        ReminderStore.removeScheduled(context, occurrenceId)
    }

    fun cancelAll(context: Context) {
        ReminderStore.allScheduled(context).forEach { payload ->
            val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            manager.cancel(firePendingIntent(context, payload.occurrenceId))
        }
        ReminderStore.clearScheduled(context)
    }

    /** Replays stored alarms after a reboot; past ones are dropped, not fired late. */
    fun rescheduleAll(context: Context): Int {
        val now = System.currentTimeMillis()
        var restored = 0

        ReminderStore.allScheduled(context).forEach { payload ->
            if (payload.scheduledAt > now) {
                schedule(context, payload)
                restored += 1
            } else {
                ReminderStore.removeScheduled(context, payload.occurrenceId)
            }
        }

        Log.i(TAG, "Restored $restored alarm(s) after boot")
        return restored
    }
}
