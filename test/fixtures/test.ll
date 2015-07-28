!0 = !{ i32 1, !"foo", i32 1 }
!1 = !{ i32 4, !"bar", i32 37 }
!2 = !{ i32 2, !"qux", i32 42 }
!3 = !{ i32 3, !"qux", !{!"foo", i32 1 }}
!llvm.module.flags = !{ !0, !1, !2, !3 }

define i32 @test(i32 %x) {
entry:
        %addtmp = add i32 3, %x
        %addtmp1 = add i32 %x, 3
        %multmp = mul i32 %addtmp, %addtmp1
        ret i32 %multmp
}

