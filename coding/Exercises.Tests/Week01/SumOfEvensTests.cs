using Exercises.Week01;

namespace Exercises.Tests.Week01;

public class SumOfEvensTests
{
    [Fact] public void Sums_only_even_numbers() => Assert.Equal(6, SumOfEvens.Calculate(new[] { 1, 2, 3, 4 }));
    [Fact] public void Empty_array_returns_zero() => Assert.Equal(0, SumOfEvens.Calculate(Array.Empty<int>()));
    [Fact] public void Handles_negative_even_numbers() => Assert.Equal(-2, SumOfEvens.Calculate(new[] { -2, 3 }));
    [Fact] public void All_odd_returns_zero() => Assert.Equal(0, SumOfEvens.Calculate(new[] { 1, 3, 5 }));
}
