using Exercises.Week02;

namespace Exercises.Tests.Week02;

public class NotificationsTests
{
    private sealed class FakeNotifier : INotifier
    {
        public string Channel => "fake";
        public List<string> Sent { get; } = new();
        public bool Send(string to, string message) { Sent.Add($"{to}:{message}"); return true; }
    }

    [Fact] public void Email_channel() => Assert.Equal("email", new EmailNotifier().Channel);
    [Fact] public void Sms_fails_when_too_long() => Assert.False(new SmsNotifier().Send("+353", new string('x', 161)));
    [Fact] public void Sms_ok_when_short() => Assert.True(new SmsNotifier().Send("+353", "hi"));
    [Fact]
    public void Service_sends_through_every_notifier()
    {
        var fake = new FakeNotifier();
        var svc = new NotificationService(new INotifier[] { new EmailNotifier(), new SmsNotifier(), fake });
        Assert.Equal(3, svc.NotifyAll("me", "Interview tomorrow"));
        Assert.Single(fake.Sent);
    }
    [Fact]
    public void Counts_only_successes()
    {
        var svc = new NotificationService(new INotifier[] { new EmailNotifier(), new SmsNotifier() });
        Assert.Equal(1, svc.NotifyAll("me", new string('x', 200)));
    }
}
