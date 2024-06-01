#include<stdio.h>
#include<stdlib.h>
/*
gcc -m32 -o ch13 ch13.c -fno-stack-protector
*/
int main()
{

  int check = 0x04030201;
  int var = 0x00000000;
  char buf[40];

  fgets(buf,50,stdin);

  printf("\n[buf]: %s\n", buf);
  printf("[check] %x\n", check);

  if ((check != 0x04030201) && (check != 0xdeadbeef))
    printf ("\nYou are on the right way !\n");

  if (check == 0xdeadbeef && var == -1)
   {
     printf("Yeah dude ! You win !\n");
     system("cat flag.txt");
   }
   return 1;
}