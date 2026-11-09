using Exercises.Week01;

namespace Exercises.Tests.Week01;

public class PriceCalculatorTests
{
    [Fact] public void Adds_vat_and_rounds() => Assert.Equal(36.90m, PriceCalculator.Total(10m, 3, 0.23m));
    [Fact] public void Rounds_to_two_decimals() => Assert.Equal(1.23m, PriceCalculator.Total(0.999m, 1, 0.23m));
    [Fact] public void Zero_quantity_is_zero() => Assert.Equal(0m, PriceCalculator.Total(5m, 0, 0.23m));
    [Fact] public void Negative_quantity_throws() => Assert.Throws<ArgumentOutOfRangeException>(() => PriceCalculator.Total(5m, -1, 0.23m));
    [Fact] public void Negative_price_throws() => Assert.Throws<ArgumentOutOfRangeException>(() => PriceCalculator.Total(-5m, 1, 0.23m));
}
