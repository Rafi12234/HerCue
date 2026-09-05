package expo.modules.hercuereminders

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/** AlarmManager forgets everything across a reboot, so stored alarms are replayed. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != Intent.ACTION_MY_PACKAGE_REPLACED &&
            action != "android.intent.action.QUICKBOOT_POWERON"
        ) {
            return
        }

        Log.i(TAG, "Restoring alarms after $action")
        ReminderNotifier.ensureChannels(context)
        runCatching { AlarmScheduler.rescheduleAll(context) }
            .onFailure { Log.e(TAG, "Alarm restore failed", it) }
    }

    companion object {
        private const val TAG = "HerCueAlarm"
    }
}
