// Public privacy policy. Health Connect (Android) links here from its
// permission sheet — see health_connect_privacy_policy_url in
// android/app/src/main/res/values/strings.xml — so it must stay reachable
// without signing in.
export const metadata = { title: 'Privacy Policy — VitalMind' }

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 text-warm-800 space-y-4 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold text-warm-900">Privacy Policy</h1>

      <h2 className="text-lg font-semibold pt-2">Health data</h2>
      <p>
        With your permission, the VitalMind app reads steps, walking distance, active calories,
        sleep, heart rate and weight from Health Connect (Android) or Apple Health (iOS). VitalMind
        only reads this data — it never writes to or deletes anything in your health store.
      </p>
      <p>
        Daily totals are saved to your private VitalMind account so you can see trends, get a
        wellness score, and let the AI companion personalise its suggestions. Only you can access
        them. They are never sold, shared with advertisers, or used for anything other than
        showing you your own wellness insights.
      </p>

      <h2 className="text-lg font-semibold pt-2">Phone usage (Android, optional)</h2>
      <p>
        If you turn on &ldquo;Sleep from phone usage&rdquo;, VitalMind reads when your screen turned on and off
        overnight to estimate how long you slept. It does not read which apps you used, your
        messages, or any content. Only the resulting sleep estimate (in hours) is saved.
      </p>

      <h2 className="text-lg font-semibold pt-2">AI features</h2>
      <p>
        Messages you send to the AI companion, along with a short summary of your recent wellness
        data, are sent to our AI provider to generate a reply. They are not used to train models.
      </p>

      <h2 className="text-lg font-semibold pt-2">Your control</h2>
      <p>
        You can revoke health or usage access at any time from your phone&apos;s settings, and
        delete your account data by contacting us from within the app.
      </p>
    </main>
  )
}
