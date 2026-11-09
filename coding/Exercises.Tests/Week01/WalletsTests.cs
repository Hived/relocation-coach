using Exercises.Week01;

namespace Exercises.Tests.Week01;

public class WalletsTests
{
    [Fact] public void Struct_add_works() { var m = new MoneyStruct(1); m.Add(2); Assert.Equal(3, m.Amount); }
    [Fact] public void Class_deposit_works() { var w = new WalletClass(1); w.Deposit(2); Assert.Equal(3, w.Balance); }
    [Fact] public void Copying_a_struct_makes_an_independent_copy() => Assert.Equal(10m, Demo.CopyStructThenChange());
    [Fact] public void Copying_a_class_reference_shares_the_object() => Assert.Equal(15m, Demo.CopyClassThenChange());
}
