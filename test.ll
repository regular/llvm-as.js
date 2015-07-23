define i32 @test(i32 %x) {
entry:
        %addtmp = add i32 3, %x
        %addtmp1 = add i32 %x, 3
        %multmp = mul i32 %addtmp, %addtmp1
        ret i32 %multmp
}

