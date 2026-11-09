namespace Exercises.Week01;

public struct MoneyStruct
{
    public decimal Amount { get; private set; }
    public MoneyStruct(decimal amount) => Amount = amount;

    public void Add(decimal amount)
    {
        // TODO
        throw new NotImplementedException();
    }
}

public class WalletClass
{
    public decimal Balance { get; private set; }
    public WalletClass(decimal balance) => Balance = balance;

    public void Deposit(decimal amount)
    {
        // TODO
        throw new NotImplementedException();
    }
}

public static class Demo
{
    // My prediction: CopyStructThenChange returns ??? and CopyClassThenChange returns ???
    public static decimal CopyStructThenChange()
    {
        // TODO
        throw new NotImplementedException();
    }

    public static decimal CopyClassThenChange()
    {
        // TODO
        throw new NotImplementedException();
    }
}
