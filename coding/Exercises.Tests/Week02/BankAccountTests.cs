using Exercises.Week02;

namespace Exercises.Tests.Week02;

public class BankAccountTests
{
    [Fact] public void Starts_empty() { var a = new BankAccount("Hicham"); Assert.Equal(0, a.Balance); Assert.Equal("Hicham", a.Owner); }
    [Fact] public void Deposit_and_withdraw() { var a = new BankAccount("x"); a.Deposit(100); a.Withdraw(30); Assert.Equal(70, a.Balance); Assert.Equal(new[] { 100m, -30m }, a.History); }
    [Fact] public void Negative_deposit_throws() => Assert.Throws<ArgumentOutOfRangeException>(() => new BankAccount("x").Deposit(-1));
    [Fact] public void Overdraft_throws() { var a = new BankAccount("x"); a.Deposit(10); Assert.Throws<InvalidOperationException>(() => a.Withdraw(11)); Assert.Equal(10, a.Balance); }
    [Fact] public void Balance_has_no_public_setter() => Assert.Null(typeof(BankAccount).GetProperty("Balance")!.GetSetMethod());
}
