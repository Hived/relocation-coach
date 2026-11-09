namespace Exercises.Week02;

public interface INotifier
{
    string Channel { get; }
    bool Send(string to, string message);
}

public class EmailNotifier : INotifier
{
    // TODO: return "email"
    public string Channel => throw new NotImplementedException();

    public bool Send(string to, string message)
    {
        // TODO: pretend to send, return true
        throw new NotImplementedException();
    }
}

public class SmsNotifier : INotifier
{
    // TODO: return "sms"
    public string Channel => throw new NotImplementedException();

    public bool Send(string to, string message)
    {
        // TODO: fail (return false) when the message is longer than 160 characters
        throw new NotImplementedException();
    }
}

public class NotificationService
{
    public NotificationService(IEnumerable<INotifier> notifiers)
    {
        // TODO: keep the notifiers
    }

    public int NotifyAll(string to, string message)
    {
        // TODO: send through every notifier, count successes
        throw new NotImplementedException();
    }
}
