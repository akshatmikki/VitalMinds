package com.vitalmind.app;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Process;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Exposes the phone's screen on/off history (from UsageStatsManager) so the
// web layer can estimate sleep as the longest overnight stretch the screen
// stayed off. Needs the special "Usage access" permission, which the user
// grants from system settings — openAccessSettings() takes them there.
@CapacitorPlugin(name = "PhoneUsage")
public class PhoneUsagePlugin extends Plugin {

    @PluginMethod
    public void checkAccess(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("supported", Build.VERSION.SDK_INT >= Build.VERSION_CODES.P);
        ret.put("granted", hasUsageAccess());
        call.resolve(ret);
    }

    @PluginMethod
    public void openAccessSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.setData(Uri.parse("package:" + getContext().getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(intent);
        } catch (Exception e) {
            // Some OEMs reject the package-scoped variant; fall back to the list.
            Intent fallback = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(fallback);
        }
        call.resolve();
    }

    // Returns screen on/off transitions between startMs and endMs as
    // [{ t: epochMs, on: boolean }], oldest first. Android keeps roughly the
    // last week of these events.
    @PluginMethod
    public void getScreenEvents(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            call.reject("Screen events need Android 9 or newer");
            return;
        }
        if (!hasUsageAccess()) {
            call.reject("Usage access not granted");
            return;
        }
        Long startMs = call.getLong("startMs");
        Long endMs = call.getLong("endMs");
        if (startMs == null || endMs == null) {
            call.reject("startMs and endMs are required");
            return;
        }

        UsageStatsManager usm = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
        UsageEvents events = usm.queryEvents(startMs, endMs);
        UsageEvents.Event event = new UsageEvents.Event();
        JSArray out = new JSArray();
        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            int type = event.getEventType();
            if (type == UsageEvents.Event.SCREEN_INTERACTIVE || type == UsageEvents.Event.SCREEN_NON_INTERACTIVE) {
                JSObject e = new JSObject();
                e.put("t", event.getTimeStamp());
                e.put("on", type == UsageEvents.Event.SCREEN_INTERACTIVE);
                out.put(e);
            }
        }
        JSObject ret = new JSObject();
        ret.put("events", out);
        call.resolve(ret);
    }

    private boolean hasUsageAccess() {
        AppOpsManager appOps = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
        int mode;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            mode = appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), getContext().getPackageName());
        } else {
            mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), getContext().getPackageName());
        }
        return mode == AppOpsManager.MODE_ALLOWED;
    }
}
