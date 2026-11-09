using Exercises.Week01;

namespace Exercises.Tests.Week01;

public class MinMaxTests
{
    [Fact] public void Finds_min_and_max() => Assert.Equal((-2, 9), MinMax.Find(new[] { 3, 9, -2, 7 }));
    [Fact] public void Single_element() => Assert.Equal((5, 5), MinMax.Find(new[] { 5 }));
    [Fact] public void Empty_throws() => Assert.Throws<ArgumentException>(() => MinMax.Find(Array.Empty<int>()));
    [Fact] public void Null_throws() => Assert.Throws<ArgumentNullException>(() => MinMax.Find(null!));
}
