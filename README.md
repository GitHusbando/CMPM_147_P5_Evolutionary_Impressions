# Bézier Birds

Credit: Adam Smith
Edited by: Julian Cady

I tried to use a 2d array of numbers that were expressed as two-pointed curved shapes made of Bézier curves because:
	1) I wanted to try using Bézier curves in p5js.
	2) They're the sort of shape I tend to use most when I make vector art.
I wanted to use an array of varying length specifically because I wanted to try making it so the program didn't rely on hard-coding the base images.

I decided on using a simple single mutation (a change to just one aspect of the image) at a time so that the fitness formula could easily judge whether that single change was good or bad.
On the flip side of that, I could have changed multiple things at a time, which could have meant more variety, and maybe? would have been better for a recombination approach.

I'm curious about trying a combination-based approach, but that seems like it would have required me to add a lot of new things to the code, and I'm pretty short on time.
Generating the initialization code was tough because I relied on the get() function, which is very slow, especially on large images.
Until I decided to make one single mutation at a time, I was changing a bunch of things every mutation, which predictably didn't work very well.

Inspiration images:
duck: http://st2.depositphotos.com/1037163/9523/i/110/depositphotos_95233928-stock-photo-male-mallard-duck.jpg
	tiny image with low contrast, takes a long time to get visible results
heron: https://2.bp.blogspot.com/-_UfM2LENOO0/UqwF14sk07I/AAAAAAAAaQ0/nhut_qK4Qak/s400/Great+Blue+Heron+Bird+Wallpapers.jpg
	medium-sized image with some contrast
macaw: https://images.pexels.com/photos/2540644/pexels-photo-2540644.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2
	larger image with a lot of color contrast, relatively fast results, fun to watch
