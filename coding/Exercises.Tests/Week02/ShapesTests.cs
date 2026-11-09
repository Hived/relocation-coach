using Exercises.Week02;

namespace Exercises.Tests.Week02;

public class ShapesTests
{
    [Fact] public void Circle_area() => Assert.Equal(Math.PI * 4, new Circle(2).Area(), 6);
    [Fact] public void Rectangle_area() => Assert.Equal(12, new Rectangle(3, 4).Area());
    [Fact] public void Square_is_a_rectangle() { Shape s = new Square(3); Assert.IsAssignableFrom<Rectangle>(s); Assert.Equal(9, s.Area()); }
    [Fact] public void Default_describe() => Assert.Equal("Shape with area 12.00", new Rectangle(3, 4).Describe());
    [Fact] public void Circle_overrides_describe() => Assert.Equal("Circle r=2", new Circle(2).Describe());
    [Fact] public void Total_area_is_polymorphic() => Assert.Equal(12 + 9 + Math.PI, ShapeTools.TotalArea(new Shape[] { new Rectangle(3, 4), new Square(3), new Circle(1) }), 6);
    [Fact] public void Invalid_size_throws() => Assert.Throws<ArgumentOutOfRangeException>(() => new Circle(0));
}
