package expo.modules.hercuereminders

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Everything the native layer needs to raise one reminder without JavaScript.
 *
 * The app process is usually dead when an alarm fires, so the payload is stored
 * in full alongside the alarm rather than being looked up from SQLite at
 * trigger time.
 */
data class ReminderPayload(
    val occurrenceId: String,
    val occurrenceKey: String,
    val type: String,
    val title: String,
    val body: String,
    val speech: String,
    val scheduledAt: Long,
    val channelId: String,
    val actions: List<ReminderAction>,
    val vibrate: Boolean,
    val speak: Boolean,
    val snoozeMinutes: Int,
    /**
     * For reminders anchored to the last confirmation (food, bathroom): how far
     * ahead to re-arm when the user confirms. Null for fixed-grid reminders.
     */
    val followUpMinutes: Int?
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("occurrenceId", occurrenceId)
        put("occurrenceKey", occurrenceKey)
        put("type", type)
        put("title", title)
        put("body", body)
        put("speech", speech)
        put("scheduledAt", scheduledAt)
        put("channelId", channelId)
        put("vibrate", vibrate)
        put("speak", speak)
        put("snoozeMinutes", snoozeMinutes)
        if (followUpMinutes != null) put("followUpMinutes", followUpMinutes)
        put("actions", JSONArray().apply {
            actions.forEach { put(JSONObject().apply { put("id", it.id); put("label", it.label) }) }
        })
    }

    companion object {
        fun fromJson(json: JSONObject): ReminderPayload {
            val actionsJson = json.optJSONArray("actions") ?: JSONArray()
            val actions = (0 until actionsJson.length()).map { index ->
                val item = actionsJson.getJSONObject(index)
                ReminderAction(item.getString("id"), item.getString("label"))
            }

            return ReminderPayload(
                occurrenceId = json.getString("occurrenceId"),
                occurrenceKey = json.optString("occurrenceKey", json.getString("occurrenceId")),
                type = json.getString("type"),
                title = json.getString("title"),
                body = json.getString("body"),
                speech = json.optString("speech", ""),
                scheduledAt = json.getLong("scheduledAt"),
                channelId = json.optString("channelId", ReminderNotifier.CHANNEL_REMINDERS),
                actions = actions,
                vibrate = json.optBoolean("vibrate", true),
                speak = json.optBoolean("speak", true),
                snoozeMinutes = json.optInt("snoozeMinutes", 15),
                followUpMinutes = if (json.has("followUpMinutes")) {
                    json.getInt("followUpMinutes")
                } else {
                    null
                }
            )
        }
    }
}

data class ReminderAction(val id: String, val label: String)

/**
 * Durable store of scheduled payloads and of actions the user took while no JS
 * runtime was alive.
 *
 * AlarmManager loses everything on reboot, so scheduled payloads are mirrored
 * here and replayed by [BootReceiver].
 */
object ReminderStore {
    private const val PREFS = "hercue_reminders"
    private const val KEY_SCHEDULED = "scheduled"
    private const val KEY_PENDING_ACTIONS = "pending_actions"

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    @Synchronized
    fun putScheduled(context: Context, payload: ReminderPayload) {
        val all = readScheduled(context).toMutableMap()
        all[payload.occurrenceId] = payload
        writeScheduled(context, all)
    }

    @Synchronized
    fun removeScheduled(context: Context, occurrenceId: String) {
        val all = readScheduled(context).toMutableMap()
        all.remove(occurrenceId)
        writeScheduled(context, all)
    }

    @Synchronized
    fun clearScheduled(context: Context) {
        prefs(context).edit().remove(KEY_SCHEDULED).apply()
    }

    fun getScheduled(context: Context, occurrenceId: String): ReminderPayload? =
        readScheduled(context)[occurrenceId]

    fun allScheduled(context: Context): List<ReminderPayload> =
        readScheduled(context).values.toList()

    private fun readScheduled(context: Context): Map<String, ReminderPayload> {
        val raw = prefs(context).getString(KEY_SCHEDULED, null) ?: return emptyMap()
        return runCatching {
            val array = JSONArray(raw)
            (0 until array.length()).mapNotNull { index ->
                runCatching { ReminderPayload.fromJson(array.getJSONObject(index)) }.getOrNull()
            }.associateBy { it.occurrenceId }
        }.getOrDefault(emptyMap())
    }

    private fun writeScheduled(context: Context, all: Map<String, ReminderPayload>) {
        val array = JSONArray()
        all.values.forEach { array.put(it.toJson()) }
        prefs(context).edit().putString(KEY_SCHEDULED, array.toString()).apply()
    }

    /**
     * Records an action taken from a notification. JavaScript drains this on its
     * next run and writes the rows, keeping the real action timestamp.
     */
    @Synchronized
    fun enqueueAction(
        context: Context,
        occurrenceId: String,
        type: String,
        action: String,
        actedAt: Long,
        followUpOccurrenceId: String?,
        followUpAt: Long?
    ) {
        val queue = readActions(context)

        // Notification actions can be delivered twice; the queue must not grow a
        // second entry for the same decision.
        for (index in 0 until queue.length()) {
            val existing = queue.getJSONObject(index)
            if (existing.getString("occurrenceId") == occurrenceId &&
                existing.getString("action") == action
            ) {
                return
            }
        }

        queue.put(JSONObject().apply {
            put("occurrenceId", occurrenceId)
            put("type", type)
            put("action", action)
            put("actedAt", actedAt)
            if (followUpOccurrenceId != null) put("followUpOccurrenceId", followUpOccurrenceId)
            if (followUpAt != null) put("followUpAt", followUpAt)
        })

        prefs(context).edit().putString(KEY_PENDING_ACTIONS, queue.toString()).apply()
    }

    fun pendingActionsJson(context: Context): String =
        prefs(context).getString(KEY_PENDING_ACTIONS, "[]") ?: "[]"

    @Synchronized
    fun clearPendingActions(context: Context) {
        prefs(context).edit().remove(KEY_PENDING_ACTIONS).apply()
    }

    private fun readActions(context: Context): JSONArray =
        runCatching { JSONArray(pendingActionsJson(context)) }.getOrDefault(JSONArray())
}
