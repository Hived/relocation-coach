using Exercises.Week01;

namespace Exercises.Tests.Week01;

public class FizzBuzzTests
{
    [Fact] public void First_fifteen_are_correct() =>
        Assert.Equal(new[] { "1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz" }, FizzBuzz.Generate(15));
    [Fact] public void Zero_gives_empty_list() => Assert.Empty(FizzBuzz.Generate(0));
    [Fact] public void Negative_gives_empty_list() => Assert.Empty(FizzBuzz.Generate(-3));
}
