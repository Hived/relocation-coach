using Exercises.Week01;

namespace Exercises.Tests.Week01;

public class TwoSumTests
{
    [Fact] public void Basic_case() => Assert.Equal(new[] { 0, 1 }, TwoSum.Find(new[] { 2, 7, 11, 15 }, 9));
    [Fact] public void Not_at_start() => Assert.Equal(new[] { 1, 2 }, TwoSum.Find(new[] { 3, 2, 4 }, 6));
    [Fact] public void Same_value_twice() => Assert.Equal(new[] { 0, 1 }, TwoSum.Find(new[] { 3, 3 }, 6));
    [Fact] public void Negative_numbers() => Assert.Equal(new[] { 2, 4 }, TwoSum.Find(new[] { -1, -2, -3, -4, -5 }, -8));
    [Fact(Timeout = 2000)]
    public async Task Large_input_is_fast()
    {
        await Task.Yield();
        var nums = Enumerable.Range(0, 200_000).ToArray();
        Assert.Equal(new[] { 199_998, 199_999 }, TwoSum.Find(nums, 399_997));
    }
}
